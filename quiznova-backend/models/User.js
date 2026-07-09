import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['guest', 'user', 'sub_admin', 'admin'],
    default: 'user'
  },
  totalXP: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  streak: {
    type: Number,
    default: 0,
    min: 0
  },
  streakShieldCount: {
    type: Number,
    default: 3,
    min: 0,
    max: 10
  },
  interests: {
    type: [String],
    default: []
  },
  langPref: {
    type: String,
    enum: ['en', 'hi'],
    default: 'en'
  },
  avatar: {
    type: String,
    default: 'US'
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  // Email verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifyToken: {
    type: String,
    default: null
  },
  emailVerifyExpires: {
    type: Date,
    default: null
  },
  // Refresh token (hashed)
  refreshToken: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update updatedAt on every save
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('User', UserSchema);
