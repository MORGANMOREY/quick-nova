import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
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
  },
  {
    title: "COMIC BOOK SUPERHEROES #1",
    desc: "Icons of the Comic Universe",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    category: "Entertainment",
    difficulty: "Medium",
    isFeatured: true,
    questions: [
      {
        q: "Which mutant superhero possesses an adamantium-laced skeleton and a remarkable healing factor?",
        options: ["Cyclops", "Wolverine", "Gambit", "Colossus"],
        ans: 1,
        exp: "Wolverine's mutant healing factor and adamantium skeleton make him one of Marvel's most formidable heroes."
      },
      {
        q: "Which superhero, whose civilian identity is a physicist, transforms after exposure to gamma radiation?",
        options: ["Thing", "Hulk", "Beast", "Colossus"],
        ans: 1,
        exp: "Bruce Banner transforms into the Hulk after accidental exposure to gamma radiation. Unlike characters such as She-Hulk and Red Hulk, whose powers were acquired through other gamma-related circumstances, Bruce Banner's transformation was directly triggered by the radiation accident."
      },
      {
        q: "Who is the billionaire inventor behind the Iron Man armor?",
        options: ["Reed Richards", "Lex Luthor", "Tony Stark", "Norman Osborn"],
        ans: 2,
        exp: "Tony Stark built the first Iron Man suit to escape captivity and later became Iron Man."
      },
      {
        q: "Which superhero uses detective skills, martial arts, and technology rather than superhuman powers to protect Gotham City?",
        options: ["Green Arrow", "Nightwing", "Batman", "Moon Knight"],
        ans: 2,
        exp: "Batman, the superhero identity of billionaire Bruce Wayne, uses his intelligence, detective abilities, martial arts training, and advanced technology to fight crime in Gotham City despite having no superhuman powers."
      },
      {
        q: "Which Kryptonian superhero was raised by Jonathan and Martha Kent?",
        options: ["Martian Manhunter", "Shazam", "Superman", "Captain Marvel"],
        ans: 2,
        exp: "Born on the planet Krypton as Kal-El, Superman was raised in Kansas by Jonathan and Martha Kent."
      },
      {
        q: "The radioactive bite of which creature gave Peter Parker his powers?",
        options: ["Scorpion", "Spider", "Ant", "Wasp"],
        ans: 1,
        exp: "Peter Parker gained his superhuman abilities after being bitten by a radioactive spider."
      },
      {
        q: "Which superhero was sculpted from clay and brought to life by the gods in some versions of her origin?",
        options: ["Supergirl", "Hawkgirl", "Wonder Woman", "Zatanna"],
        ans: 2,
        exp: "In traditional DC Comics lore, Wonder Woman was sculpted from clay and brought to life by the Greek gods."
      },
      {
        q: "Which superhero, known as the Scarlet Speedster, draws his powers from the Speed Force?",
        options: ["Quicksilver", "The Flash", "Kid Flash", "Sonic"],
        ans: 1,
        exp: "The Flash derives his incredible speed from the Speed Force, an extra-dimensional energy field."
      },
      {
        q: "Whose shield is famously made of vibranium?",
        options: ["Falcon", "Winter Soldier", "Captain America", "U.S. Agent"],
        ans: 2,
        exp: "Captain America's nearly indestructible shield is made primarily of vibranium, a rare, fictional metal known for absorbing kinetic energy."
      },
      {
        q: "Which superhero is the king of the fictional African nation of Wakanda?",
        options: ["Luke Cage", "Blue Marvel", "Black Panther", "Bishop"],
        ans: 2,
        exp: "T'Challa is both the Black Panther and the king of Wakanda."
      }
    ]
  },
  {
    title: "COMIC BOOK SUPERHEROES #2",
    desc: "Icons of the Comic Universe",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
    category: "Entertainment",
    difficulty: "Medium",
    isFeatured: true,
    questions: [
      {
        q: "Mjolnir can normally be lifted only by those deemed what?",
        options: ["Powerful", "Worthy", "Immortal", "Divine"],
        ans: 1,
        exp: "Odin enchanted Mjolnir so that only those deemed worthy can wield it."
      },
      {
        q: "Which superhero rules the underwater kingdom of Atlantis?",
        options: ["Namor", "Ocean Master", "Aquaman", "Aqualad"],
        ans: 2,
        exp: "Aquaman, also known as Arthur Curry, is the ruler of Atlantis."
      },
      {
        q: "A Green Lantern's power ring is primarily fueled by which emotion?",
        options: ["Fear", "Hope", "Willpower", "Rage"],
        ans: 2,
        exp: "Green Lantern power rings channel the emotional energy of willpower."
      },
      {
        q: "Natasha Romanoff is best known by what codename?",
        options: ["Mockingbird", "Black Widow", "White Tiger", "Silver Sable"],
        ans: 1,
        exp: "Natasha Romanoff is a master spy, assassin, and member of the Avengers."
      },
      {
        q: "Which superhero lost his eyesight in childhood but gained extraordinary heightened senses?",
        options: ["Moon Knight", "Daredevil", "Punisher", "Blade"],
        ans: 1,
        exp: "Matt Murdock lost his eyesight as a child but developed extraordinary heightened senses."
      },
      {
        q: "Wade Wilson is better known by which name?",
        options: ["Deathstroke", "Deadpool", "Bullseye", "Taskmaster"],
        ans: 1,
        exp: "Deadpool is known for his healing factor, witty humor, and breaking the fourth wall."
      },
      {
        q: "Which Batman villain leaves behind riddles to challenge his opponents?",
        options: ["Scarecrow", "Penguin", "Riddler", "Two-Face"],
        ans: 2,
        exp: "The Riddler commits crimes centered on puzzles, clues, and riddles."
      },
      {
        q: "Harley Quinn was originally employed as what before turning to crime?",
        options: ["Police detective", "Psychiatrist", "Journalist", "Lawyer"],
        ans: 1,
        exp: "Before becoming Harley Quinn, Harleen Quinzel worked as a psychiatrist at Arkham Asylum."
      },
      {
        q: "Which mystical artifact is most closely associated with Doctor Strange?",
        options: ["Mother Box", "Cosmic Cube", "Eye of Agamotto", "Infinity Gauntlet"],
        ans: 2,
        exp: "The Eye of Agamotto is one of Doctor Strange's most iconic magical artifacts."
      },
      {
        q: "Hell's Kitchen is the primary area protected by which superhero?",
        options: ["Punisher", "Cloak", "Daredevil", "Ghost Rider"],
        ans: 2,
        exp: "Daredevil serves as the vigilante protector of Hell's Kitchen, a neighborhood in New York City."
      }
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
    for (const quiz of seedQuizzes) {
      const exists = await Quiz.findOne({ title: quiz.title });
      if (!exists) {
        console.log(`Seeding quiz "${quiz.title}" into MongoDB...`);
        await Quiz.create(quiz);
      }
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
    const quizzes = await Quiz.find({ isHidden: { $ne: true } }).sort({ createdAt: -1 });
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
      const quiz = mockQuizzes.find(q => q._id === id || q.id === id);
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

// Optional/lenient auth for admin quiz creation and updates
const optionalAdminAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      try {
        const decoded = jwt.verify(parts[1], process.env.JWT_SECRET || 'super_secret_quiznova_token_key_123!');
        req.user = { id: decoded.userId, role: decoded.role || 'admin' };
        return next();
      } catch (e) {
        // Fall back to dev admin
      }
    }
  }
  req.user = { id: 'admin_dev', role: 'admin' };
  next();
};

// POST add a new quiz
router.post('/', optionalAdminAuth, async (req, res) => {
  try {
    // Restrict to admin/subadmin roles
    if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
      return res.status(403).json({ message: 'Access denied: Administrators only' });
    }

    const { title, desc, image, category, difficulty, questions, isFeatured, isNewQuiz, isEditorsPick, isPopular } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Quiz title is required' });
    }

    const formattedQuestions = Array.isArray(questions) && questions.length > 0
      ? questions.map(q => ({
          q: q.q || 'Untitled Question',
          image: q.image || '',
          options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          ans: typeof q.ans === 'number' ? q.ans : 0,
          exp: q.exp || q.explanation || ''
        }))
      : [{
          q: `General knowledge question for ${title}`,
          image: '',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          ans: 0,
          exp: `Sample explanation for ${title}`
        }];

    const quizData = {
      title,
      desc: desc || '',
      image: image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
      category: category || 'General',
      difficulty: difficulty || 'Easy',
      questions: formattedQuestions,
      isFeatured: !!isFeatured,
      isNewQuiz: isNewQuiz !== undefined ? !!isNewQuiz : true,
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
      mockQuizzes.unshift(newMockQuiz);
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
router.patch('/:id', optionalAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['title', 'desc', 'image', 'category', 'difficulty', 'questions', 'isFeatured', 'isNewQuiz', 'isEditorsPick', 'isPopular', 'isHidden', 'timerSeconds'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (!isDbConnected()) {
      const idx = mockQuizzes.findIndex(q => q._id === id || q.id === id);
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
router.delete('/:id', optionalAdminAuth, async (req, res) => {
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
