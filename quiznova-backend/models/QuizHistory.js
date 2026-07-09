import mongoose from 'mongoose';

const QuizHistorySchema = new mongoose.Schema({
  userId: {
    // Mixed supports both real ObjectIds and in-memory mock string IDs
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  quizId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  quizTitle: {
    type: String,
    required: true
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  xpEarned: {
    type: Number,
    required: true,
    min: 0
  },
  maxStreak: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('QuizHistory', QuizHistorySchema);
