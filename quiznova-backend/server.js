import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import quizRoutes, { seedDatabaseIfEmpty } from './routes/quizzes.js';
import userRoutes, { seedLeaderboardUsersIfEmpty } from './routes/users.js';
import { verifyMailerConnection } from './utils/mailer.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS — allow localhost (dev), Vercel, Render, localtunnel, and any configured FRONTEND_URL
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.onrender\.com$/,
  /^https:\/\/.*\.loca\.lt$/,
  /^https:\/\/.*\.lhr\.life$/,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    if (allowed) return callback(null, true);
    callback(null, true); // Permissive in dev/tunnels
  },
  credentials: true
}));

// Body parsing with size limit
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Simple in-process rate limiter (per IP, no external deps)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;  // 1 minute
const RATE_LIMIT_MAX = 200;           // max 200 requests per minute per IP
app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress;
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    entry.count = 1;
    entry.start = now;
  } else {
    entry.count++;
  }
  rateLimitMap.set(ip, entry);
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ message: 'Too many requests. Please slow down.' });
  }
  next();
});

// Database connection helper
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiznova';
let isDbConnected = false;

async function connectDB() {
  if (isDbConnected || mongoose.connection.readyState === 1) {
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    isDbConnected = true;
    console.log('Successfully connected to MongoDB.');
    seedDatabaseIfEmpty();
    seedLeaderboardUsersIfEmpty();
    verifyMailerConnection();
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
}

// Connect to DB for serverless requests
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'QuizNova Backend is healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Start standalone HTTP server when not in serverless environment
if (!process.env.VERCEL) {
  connectDB().then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    setupGracefulShutdown(server);
  });
}

// Graceful shutdown: close DB + HTTP server cleanly on process signals
function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
      }
      process.exit(0);
    });
    // Force close after 10 seconds
    setTimeout(() => { process.exit(1); }, 10_000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

export default app;
