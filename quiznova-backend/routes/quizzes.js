import express from 'express';
import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Seed quizzes list
const seedQuizzes = [
  {
    title: "Guess the Movie: Emoji Quiz",
    desc: "It's the pictures that got small.",
    image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=600&q=80",
    category: "Entertainment",
    isFeatured: true,
    questions: [
      { q: "🎬🚢🧊", image: "https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?auto=format&fit=crop&w=600&q=80", options: ["Titanic", "Jaws", "Pirates of the Caribbean", "Cast Away"], ans: 0, exp: "Titanic (1997)" },
      { q: "🦇👨🃏", image: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=600&q=80", options: ["The Dark Knight", "Spider-Man", "Iron Man", "Superman"], ans: 0, exp: "The Dark Knight features Batman and his archenemy, the Joker." },
      { q: "👽🚲🌕", image: "https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&w=600&q=80", options: ["E.T. the Extra-Terrestrial", "Apollo 13", "Star Wars", "Alien"], ans: 0, exp: "E.T. (1982) features the iconic flying bicycle scene across the moon." }
    ]
  },
  {
    title: "Flags of the World Quiz: Undercover Edition",
    desc: "Can you identify the country based on just a fraction of a flag?",
    image: "https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&w=600&q=80",
    category: "Geography",
    isFeatured: true,
    questions: [
      { q: "Which flag has a red circle on a white background?", image: "/flags/jp.png", options: ["Japan", "South Korea", "Bangladesh", "Greenland"], ans: 0, exp: "Japan's flag is the Nisshōki, known as the Hinomaru." },
      { q: "Which country has a red maple leaf on its flag?", image: "/flags/ca.png", options: ["Canada", "Lebanon", "Peru", "Mexico"], ans: 0, exp: "Canada's national flag prominently features a red maple leaf." }
    ]
  },
  {
    title: "Snake Knowledge Quiz",
    desc: "Test your knowledge on serpents!",
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&q=80",
    category: "Animals",
    isNewQuiz: true,
    questions: [
      { q: "Which snake is known as the longest venomous snake in the world?", options: ["King Cobra", "Black Mamba", "Inland Taipan", "Rattlesnake"], ans: 0, exp: "The King Cobra can reach lengths of up to 18 feet (5.5 meters), making it the longest venomous snake." },
      { q: "What do snakes use to smell their surroundings?", options: ["Their nose", "Their tongue", "Their skin", "Their eyes"], ans: 1, exp: "Snakes use their forked tongues to collect airborne particles, which are then analyzed by the Jacobson's organ in the roof of their mouth." }
    ]
  }
];

// In-memory mock storage if database is offline
export let mockQuizzes = [...seedQuizzes].map((q, idx) => ({ ...q, _id: `mock_quiz_${idx + 1}` }));

// Helper to check DB status
const isDbConnected = () => mongoose.connection.readyState === 1;

// Seed Database helper called on app start if database connected
export const seedDatabaseIfEmpty = async () => {
  try {
    if (!isDbConnected()) return;
    const count = await Quiz.countDocuments();
    if (count === 0) {
      console.log('Seeding initial quizzes into MongoDB...');
      await Quiz.insertMany(seedQuizzes);
      console.log('Database seeded successfully.');
    }
  } catch (err) {
    console.error('Database seeding failed:', err);
  }
};

// GET all quizzes
router.get('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json(mockQuizzes);
    }
    const quizzes = await Quiz.find({ isHidden: false });
    res.json(quizzes);
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    res.status(500).json({ message: 'Server error during fetching quizzes' });
  }
});

// GET a single quiz by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const quiz = mockQuizzes.find(q => q._id === id);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
      return res.json(quiz);
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    console.error('Fetch quiz by id error:', error);
    res.status(500).json({ message: 'Server error during fetching quiz' });
  }
});

// POST add a new quiz
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Restrict to admin/subadmin roles
    if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
      return res.status(403).json({ message: 'Access denied: Administrators only' });
    }

    const { title, desc, image, category, questions, isFeatured, isNewQuiz, isEditorsPick, isPopular } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Quiz title and at least one question are required' });
    }

    const quizData = {
      title,
      desc,
      image: image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
      category: category || 'General',
      questions,
      isFeatured: !!isFeatured,
      isNewQuiz: !!isNewQuiz,
      isEditorsPick: !!isEditorsPick,
      isPopular: !!isPopular,
      isHidden: false
    };

    if (!isDbConnected()) {
      console.log('MongoDB is offline. Saving quiz in-memory.');
      const newMockQuiz = {
        _id: 'mock_quiz_' + Date.now(),
        ...quizData
      };
      mockQuizzes.push(newMockQuiz);
      return res.status(201).json(newMockQuiz);
    }

    const newQuiz = new Quiz(quizData);
    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Server error during quiz creation' });
  }
});

// PATCH update a quiz
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
      return res.status(403).json({ message: 'Access denied: Administrators only' });
    }

    const { id } = req.params;
    const allowedFields = ['title', 'desc', 'image', 'category', 'questions', 'isFeatured', 'isNewQuiz', 'isEditorsPick', 'isPopular', 'isHidden'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (!isDbConnected()) {
      const idx = mockQuizzes.findIndex(q => q._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Quiz not found' });
      mockQuizzes[idx] = { ...mockQuizzes[idx], ...updates };
      return res.json(mockQuizzes[idx]);
    }

    const quiz = await Quiz.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error during quiz update' });
  }
});

// DELETE a quiz
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
      return res.status(403).json({ message: 'Access denied: Administrators only' });
    }

    const quizId = req.params.id;

    if (!isDbConnected()) {
      console.log('MongoDB is offline. Deleting quiz in-memory.');
      mockQuizzes = mockQuizzes.filter(q => q._id !== quizId);
      return res.json({ message: 'Quiz deleted successfully (in-memory)' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    await quiz.deleteOne();
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error during quiz deletion' });
  }
});

export default router;
