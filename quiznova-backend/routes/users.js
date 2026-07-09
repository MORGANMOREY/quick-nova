import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import QuizHistory from '../models/QuizHistory.js';
import authMiddleware from '../middleware/auth.js';
import { mockUsers } from './auth.js';
import { mockQuizzes } from './quizzes.js';

const router = express.Router();

// Mock Leaderboard Seed Users
const seedLeaderboardUsers = [
  { username: "QuizMaster99", totalXP: 14500, avatar: "QM", role: "user" },
  { username: "TriviaKing", totalXP: 13200, avatar: "TK", role: "user" },
  { username: "SmartyPants", totalXP: 12850, avatar: "SP", role: "user" },
  { username: "Brainiac22", totalXP: 11400, avatar: "BR", role: "user" },
  { username: "NovaPlayer", totalXP: 10900, avatar: "NP", role: "user" }
];

// Seed Leaderboard Users helper called on app start if database connected
export const seedLeaderboardUsersIfEmpty = async () => {
  try {
    if (!isDbConnected()) return;
    const count = await User.countDocuments();
    if (count <= 2) { // Seed if only admins exist
      console.log('Seeding initial leaderboard users into MongoDB...');
      for (const u of seedLeaderboardUsers) {
        const exists = await User.findOne({ username: u.username });
        if (!exists) {
          const newUser = new User({
            username: u.username,
            email: `${u.username.toLowerCase()}@quiznova.org`,
            password: 'mock_password_123',
            role: u.role,
            avatar: u.avatar,
            totalXP: u.totalXP
          });
          await newUser.save();
        }
      }
      console.log('Leaderboard users seeded successfully.');
    }
  } catch (err) {
    console.error('Leaderboard users seeding failed:', err);
  }
};

// In-memory mock storage if database is offline
export const mockHistory = [];

// Helper to check DB status
const isDbConnected = () => mongoose.connection.readyState === 1;

// GET Leaderboards
router.get('/leaderboard', async (req, res) => {
  try {
    if (!isDbConnected()) {
      const combined = [...seedLeaderboardUsers];
      for (const mu of mockUsers) {
        const index = combined.findIndex(u => u.username === mu.username);
        if (index === -1) {
          combined.push({
            username: mu.username,
            totalXP: mu.totalXP || 0,
            avatar: mu.avatar,
            role: mu.role
          });
        } else {
          combined[index].totalXP = Math.max(combined[index].totalXP, mu.totalXP || 0);
        }
      }

      const data = combined
        .sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0))
        .map((u, idx) => ({
          rank: idx + 1,
          name: u.username,
          score: u.totalXP || 0,
          time: "Active",
          avatar: u.avatar || (u.username ? u.username.substring(0, 2).toUpperCase() : 'US')
        }));
      return res.json(data);
    }

    const topUsers = await User.find({ role: 'user' })
      .sort({ totalXP: -1 })
      .limit(100);

    const data = topUsers.map((u, idx) => ({
      rank: idx + 1,
      name: u.username,
      score: u.totalXP,
      time: "Active",
      avatar: u.avatar
    }));

    res.json(data);
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    res.status(500).json({ message: 'Server error during leaderboard retrieval' });
  }
});

// GET User History (paginated)
router.get('/users/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    if (!isDbConnected()) {
      const all = mockHistory
        .filter(h => h.userId === userId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json({
        data: all.slice(skip, skip + limit),
        total: all.length,
        page,
        totalPages: Math.ceil(all.length / limit)
      });
    }

    const [history, total] = await Promise.all([
      QuizHistory.find({ userId }).sort({ date: -1 }).skip(skip).limit(limit),
      QuizHistory.countDocuments({ userId })
    ]);

    res.json({
      data: history,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ message: 'Server error during fetching history' });
  }
});

// POST Save Quiz History & Update XP
router.post('/users/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { quizTitle, accuracy, xpEarned, maxStreak } = req.body;

    if (!quizTitle || accuracy === undefined || xpEarned === undefined) {
      return res.status(400).json({ message: 'Missing required history parameters' });
    }

    if (!isDbConnected()) {
      console.log('MongoDB is offline. Saving history log in-memory.');
      const newLog = {
        _id: 'mock_log_' + Date.now(),
        userId,
        quizTitle,
        accuracy,
        xpEarned,
        maxStreak: maxStreak || 0,
        date: new Date()
      };
      mockHistory.push(newLog);

      // Try updating in-memory mock user stats
      const mockUser = mockUsers.find(u => u._id === userId);
      if (mockUser) {
        const userLogs = mockHistory.filter(h => h.userId === userId && h._id !== newLog._id)
                                    .sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastHistory = userLogs[0];
        
        let newStreak = mockUser.streak || 0;
        let newShieldCount = mockUser.streakShieldCount !== undefined ? mockUser.streakShieldCount : 3;
        
        if (!lastHistory) {
          newStreak = 1;
        } else {
          const todayMs = new Date().setHours(0,0,0,0);
          const lastMs = new Date(lastHistory.date).setHours(0,0,0,0);
          const diffDays = Math.round((todayMs - lastMs) / (24 * 60 * 60 * 1000));
          
          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            if (newShieldCount > 0) {
              newShieldCount -= 1;
            } else {
              newStreak = 1;
            }
          }
        }
        
        mockUser.totalXP = (mockUser.totalXP || 0) + xpEarned;
        mockUser.level = Math.floor(Math.sqrt(mockUser.totalXP / 100)) + 1;
        mockUser.streak = newStreak;
        mockUser.streakShieldCount = newShieldCount;
        
        newLog.calculatedLevel = mockUser.level;
        newLog.calculatedStreak = mockUser.streak;
        newLog.calculatedStreakShieldCount = mockUser.streakShieldCount;
        newLog.calculatedTotalXP = mockUser.totalXP;
      }

      return res.status(201).json(newLog);
    }

    // Save to Database
    const newLog = new QuizHistory({
      userId,
      quizTitle,
      accuracy,
      xpEarned,
      maxStreak: maxStreak || 0,
      date: new Date()
    });
    await newLog.save();

    // Fetch and update user level/streak
    const user = await User.findById(userId);
    if (user) {
      const lastHistory = await QuizHistory.findOne({ 
        userId, 
        _id: { $ne: newLog._id } 
      }).sort({ date: -1 });

      let newStreak = user.streak || 0;
      let newShieldCount = user.streakShieldCount !== undefined ? user.streakShieldCount : 3;

      if (!lastHistory) {
        newStreak = 1;
      } else {
        const todayMs = new Date().setHours(0,0,0,0);
        const lastMs = new Date(lastHistory.date).setHours(0,0,0,0);
        const diffDays = Math.round((todayMs - lastMs) / (24 * 60 * 60 * 1000));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          if (newShieldCount > 0) {
            newShieldCount -= 1;
          } else {
            newStreak = 1;
          }
        }
      }

      user.totalXP += xpEarned;
      user.level = Math.floor(Math.sqrt(user.totalXP / 100)) + 1;
      user.streak = newStreak;
      user.streakShieldCount = newShieldCount;
      await user.save();

      // Attach updated info to response log
      const responseLog = newLog.toObject();
      responseLog.calculatedLevel = user.level;
      responseLog.calculatedStreak = user.streak;
      responseLog.calculatedStreakShieldCount = user.streakShieldCount;
      responseLog.calculatedTotalXP = user.totalXP;
      
      return res.status(201).json(responseLog);
    }

    res.status(201).json(newLog);
  } catch (error) {
    console.error('Save history error:', error);
    res.status(500).json({ message: 'Server error during history record creation' });
  }
});

// GET Database Debug Info
router.get('/debug/db', async (req, res) => {
  try {
    const dbConnected = mongoose.connection.readyState === 1;
    if (dbConnected) {
      const users = await User.find();
      const Quiz = mongoose.model('Quiz');
      const quizzes = await Quiz.find();
      const history = await QuizHistory.find();

      return res.json({
        databaseStatus: 'Online',
        databaseEngine: 'MongoDB',
        users,
        quizzes,
        history
      });
    } else {
      return res.json({
        databaseStatus: 'Offline (Fallback Mode)',
        databaseEngine: 'Node.js Memory (In-Memory Arrays)',
        users: mockUsers,
        quizzes: mockQuizzes,
        history: mockHistory
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Debug endpoint failed', error: error.message });
  }
});

export default router;
