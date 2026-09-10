import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  q: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  options: {
    type: [String],
    required: true
  },
  ans: {
    type: Number,
    required: true
  },
  exp: {
    type: String
  }
});

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  desc: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  category: {
    type: String,
    default: 'General'
  },
  difficulty: {
    type: String,
    default: 'Easy'
  },
  timerSeconds: {
    type: Number,
    default: 15
  },
  questions: {
    type: [QuestionSchema],
    default: []
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewQuiz: {
    type: Boolean,
    default: false
  },
  isEditorsPick: {
    type: Boolean,
    default: false
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Quiz', QuizSchema);
