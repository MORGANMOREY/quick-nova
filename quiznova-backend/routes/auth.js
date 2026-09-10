import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';
import { sendVerificationEmail, sendPasswordChangedEmail, sendPasswordResetEmail } from '../utils/mailer.js';

const router = express.Router();

// In-memory mock database fallback when MongoDB is offline
export const mockUsers = [
  {
    _id: 'mock_admin_1',
    username: 'admin',
    email: 'admin@quiznova.org',
    password: 'admin',
    role: 'admin',
    avatar: 'AD',
    totalXP: 5000,
    level: 10,
    streak: 5,
    streakShieldCount: 3,
    interests: ['technology', 'history'],
    langPref: 'en'
  },
  {
    _id: 'mock_subadmin_1',
    username: 'subadmin',
    email: 'subadmin@quiznova.org',
    password: 'subadmin',
    role: 'sub_admin',
    avatar: 'SA',
    totalXP: 2000,
    level: 5,
    streak: 2,
    streakShieldCount: 1,
    interests: ['science'],
    langPref: 'en'
  },
  {
    _id: 'mock_user_1',
    username: 'user',
    email: 'user@quiznova.org',
    password: 'user',
    role: 'user',
    avatar: 'US',
    totalXP: 500,
    level: 2,
    streak: 1,
    streakShieldCount: 0,
    interests: [],
    langPref: 'en'
  }
];

// Helper to check if DB is connected
const isDbConnected = () => mongoose.connection.readyState === 1;

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_quiznova_token_key_123!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_fallback_secret';

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, interests, langPref } = req.body;

    // Use mock storage if MongoDB is offline
    if (!isDbConnected()) {
      console.log('MongoDB is offline. Using in-memory fallback for registration.');
      const exists = mockUsers.find(u => u.email === email || u.username === username);
      if (exists) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }

      const avatar = username ? username.substring(0, 2).toUpperCase() : 'US';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const mockUser = {
        _id: 'mock_user_' + Date.now(),
        username,
        email,
        password: hashedPassword,
        role: role || 'user',
        avatar,
        totalXP: 0,
        level: 1,
        streak: 0,
        streakShieldCount: 3,
        interests: interests || [],
        langPref: langPref || 'en'
      };

      mockUsers.push(mockUser);

      const token = jwt.sign(
        { userId: mockUser._id, role: mockUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        token,
        user: {
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          avatar: mockUser.avatar,
          totalXP: mockUser.totalXP,
          level: mockUser.level,
          streak: mockUser.streak,
          streakShieldCount: mockUser.streakShieldCount,
          interests: mockUser.interests,
          langPref: mockUser.langPref
        }
      });
    }

    // Standard database logic
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const avatar = username ? username.substring(0, 2).toUpperCase() : 'US';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userRole = role || 'user';

    user = new User({
      username,
      email,
      password: hashedPassword,
      role: userRole,
      avatar,
      level: 1,
      streak: 0,
      streakShieldCount: 3,
      interests: interests || [],
      langPref: langPref || 'en'
    });

    await user.save();

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = verifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Issue tokens
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store hashed refresh token
    const rawRefresh = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    const refreshSalt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(rawRefresh, refreshSalt);
    await user.save();

    // Fire-and-forget verification email
    sendVerificationEmail(user.email, verifyToken);

    res.status(201).json({
      token,
      refreshToken: rawRefresh,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        totalXP: user.totalXP,
        level: user.level,
        streak: user.streak,
        streakShieldCount: user.streakShieldCount,
        interests: user.interests,
        langPref: user.langPref,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Use mock storage if MongoDB is offline
    if (!isDbConnected()) {
      console.log('MongoDB is offline. Using in-memory fallback for login.');
      const user = mockUsers.find(u => u.email === identifier || u.username === identifier);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = user.password.startsWith('$2') 
        ? await bcrypt.compare(password, user.password)
        : password === user.password;
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

      // Track last login
      user.lastLoginAt = new Date();

      return res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          totalXP: user.totalXP,
          level: user.level || 1,
          streak: user.streak || 0,
          streakShieldCount: user.streakShieldCount !== undefined ? user.streakShieldCount : 3,
          interests: user.interests || [],
          langPref: user.langPref || 'en'
        }
      });
    }

    // Standard database logic
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Track last login time
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        totalXP: user.totalXP,
        level: user.level,
        streak: user.streak,
        streakShieldCount: user.streakShieldCount,
        interests: user.interests,
        langPref: user.langPref
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET current authenticated user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!isDbConnected()) {
      const user = mockUsers.find(u => u._id === userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        totalXP: user.totalXP || 0,
        level: user.level || 1,
        streak: user.streak || 0,
        streakShieldCount: user.streakShieldCount !== undefined ? user.streakShieldCount : 3,
        interests: user.interests || [],
        langPref: user.langPref || 'en'
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      totalXP: user.totalXP,
      level: user.level,
      streak: user.streak,
      streakShieldCount: user.streakShieldCount,
      interests: user.interests,
      langPref: user.langPref,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error during profile fetch' });
  }
});

// PATCH update current authenticated user profile
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, interests, langPref, avatar } = req.body;

    // Build update object with only allowed fields
    const updates = {};
    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters' });
      }
      updates.username = username.trim();
    }
    if (interests !== undefined) {
      if (!Array.isArray(interests)) return res.status(400).json({ message: 'Interests must be an array' });
      updates.interests = interests;
    }
    if (langPref !== undefined) {
      if (!['en', 'hi'].includes(langPref)) return res.status(400).json({ message: 'langPref must be en or hi' });
      updates.langPref = langPref;
    }
    if (avatar !== undefined) updates.avatar = avatar;

    if (!isDbConnected()) {
      const user = mockUsers.find(u => u._id === userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      Object.assign(user, updates);
      return res.json({ message: 'Profile updated', user: { id: user._id, ...updates } });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        totalXP: user.totalXP,
        level: user.level,
        streak: user.streak,
        streakShieldCount: user.streakShieldCount,
        interests: user.interests,
        langPref: user.langPref
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Google login/registration
router.post('/google', async (req, res) => {
  try {
    const { token: idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    // Verify token with Google's tokeninfo API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const payload = await response.json();

    // Verify aud (client id) if we have it set
    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId) {
      if (payload.aud !== expectedClientId) {
        return res.status(400).json({ message: 'Token aud mismatch' });
      }
    }

    const { email, name, picture } = payload;

    // Use mock storage if MongoDB is offline
    if (!isDbConnected()) {
      console.log('MongoDB is offline. Using in-memory fallback for Google auth.');
      let user = mockUsers.find(u => u.email === email);

      if (!user) {
        const username = name ? name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000) : 'user' + Math.floor(Math.random() * 10000);
        const avatar = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'US';

        const salt = await bcrypt.genSalt(10);
        const randomPassword = Math.random().toString(36).substring(2, 15);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        user = {
          _id: 'mock_google_' + Date.now(),
          username,
          email,
          password: hashedPassword,
          role: 'user',
          avatar: picture || avatar,
          totalXP: 0,
          level: 1,
          streak: 0,
          streakShieldCount: 3,
          interests: [],
          langPref: 'en'
        };

        mockUsers.push(user);
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          totalXP: user.totalXP,
          level: user.level,
          streak: user.streak,
          streakShieldCount: user.streakShieldCount,
          interests: user.interests,
          langPref: user.langPref
        }
      });
    }

    // Standard database logic
    let user = await User.findOne({ email });

    if (!user) {
      const username = name ? name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000) : 'user' + Math.floor(Math.random() * 10000);
      const avatar = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'US';

      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).substring(2, 15);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        username,
        email,
        password: hashedPassword,
        role: 'user',
        avatar: picture || avatar,
        level: 1,
        streak: 0,
        streakShieldCount: 3,
        interests: [],
        langPref: 'en'
      });

      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        totalXP: user.totalXP,
        level: user.level,
        streak: user.streak,
        streakShieldCount: user.streakShieldCount,
        interests: user.interests,
        langPref: user.langPref
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error during Google auth' });
  }
});

// ─── Helper: generate access + refresh token pair ──────────────────────────
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, role },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};

// Note: we keep the old 7d token generation in register/login for backward
// compatibility while the app migrates to the refresh-token flow.

// ─── POST /refresh-token ────────────────────────────────────────────────────
// Exchange a valid refresh token for a new access token.
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    let payload;
    try {
      payload = jwt.verify(
        refreshToken,
        JWT_REFRESH_SECRET
      );
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Verify the token is still stored against the user (rotation check)
    if (isDbConnected()) {
      const user = await User.findById(payload.userId);
      if (!user) return res.status(401).json({ message: 'User not found' });

      const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken || '');
      if (!tokenMatch) return res.status(401).json({ message: 'Refresh token revoked or rotated' });

      // Rotate: issue new pair and save new hashed refresh token
      const { accessToken, refreshToken: newRefresh } = generateTokens(user._id, user.role);
      const salt = await bcrypt.genSalt(10);
      user.refreshToken = await bcrypt.hash(newRefresh, salt);
      await user.save();

      return res.json({ accessToken, refreshToken: newRefresh });
    }

    // Mock mode: just reissue without rotation check
    const { accessToken, refreshToken: newRefresh } = generateTokens(payload.userId, payload.role);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
});

// ─── PATCH /password ────────────────────────────────────────────────────────
// Change the authenticated user's password.
router.patch('/password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must differ from current password' });
    }

    if (!isDbConnected()) {
      const user = mockUsers.find(u => u._id === userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      return res.json({ message: 'Password updated successfully' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.refreshToken = null; // Invalidate all refresh tokens on password change
    await user.save();

    // Fire-and-forget confirmation email
    sendPasswordChangedEmail(user.email);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// ─── POST /forgot-password ──────────────────────────────────────────────────
// Request a 6-digit password reset verification code via email.
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: 'Email or username is required' });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    if (!isDbConnected()) {
      const user = mockUsers.find(u => u.email === identifier || u.username === identifier);
      if (!user) {
        // Return friendly message even if not found to avoid account enumeration
        return res.json({ message: 'If an account exists with that email, a reset code was sent.', devOtp: resetOtp });
      }
      user.passwordResetToken = resetOtp;
      user.passwordResetExpires = expiresAt;
      sendPasswordResetEmail(user.email, resetOtp);
      return res.json({ message: 'Reset code sent to your email', devOtp: resetOtp, email: user.email });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { username: identifier.trim() }]
    });

    if (!user) {
      return res.json({ message: 'If an account exists with that email, a reset code was sent.', devOtp: resetOtp });
    }

    user.passwordResetToken = resetOtp;
    user.passwordResetExpires = expiresAt;
    await user.save();

    sendPasswordResetEmail(user.email, resetOtp);

    res.json({ message: 'Reset code sent to your email', devOtp: resetOtp, email: user.email });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during forgot password request' });
  }
});

// ─── POST /reset-password ───────────────────────────────────────────────────
// Reset password using the 6-digit OTP code received via email.
router.post('/reset-password', async (req, res) => {
  try {
    const { identifier, resetToken, newPassword } = req.body;
    if (!identifier || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Identifier, verification code, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const cleanToken = resetToken.toString().trim();

    if (!isDbConnected()) {
      const user = mockUsers.find(u => (u.email === identifier || u.username === identifier));
      if (!user || user.passwordResetToken !== cleanToken) {
        return res.status(400).json({ message: 'Invalid or expired verification code' });
      }
      if (user.passwordResetExpires && new Date() > new Date(user.passwordResetExpires)) {
        return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      return res.json({ message: 'Password reset successfully! You can now log in.' });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { username: identifier.trim() }],
      passwordResetToken: cleanToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshToken = null; // revoke active sessions
    await user.save();

    sendPasswordChangedEmail(user.email);

    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// ─── GET /verify-email ──────────────────────────────────────────────────────
// Confirm a user's email using the token sent during registration.
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Verification token required' });

    if (!isDbConnected()) {
      return res.json({ message: 'Email verification is only supported in database mode' });
    }

    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Verification token is invalid or has expired' });
    }

    user.emailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

// ─── POST /resend-verification ──────────────────────────────────────────────
// Resend the verification email if the user didn't receive it.
router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ message: 'Email verification only supported in database mode' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email is already verified' });

    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = verifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    sendVerificationEmail(user.email, verifyToken);
    res.json({ message: 'Verification email resent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error during resend' });
  }
});

// ─── GET /admin/users ───────────────────────────────────────────────────────
// Admin: list all users with filters, sort, and pagination.
router.get('/admin/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
      return res.status(403).json({ message: 'Access denied: Administrators only' });
    }

    if (!isDbConnected()) {
      return res.json({
        data: mockUsers.map(u => ({
          id: u._id, username: u.username, email: u.email,
          role: u.role, totalXP: u.totalXP, level: u.level,
          streak: u.streak, emailVerified: false, createdAt: null
        })),
        total: mockUsers.length,
        page: 1,
        totalPages: 1
      });
    }

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const role  = req.query.role;   // optional filter
    const sort  = req.query.sort === 'xp' ? { totalXP: -1 } : { createdAt: -1 };

    const filter = {};
    if (role) filter.role = role;
    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { email:    { $regex: q, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password -refreshToken -emailVerifyToken')
          .sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({
      data: users.map(u => ({
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        totalXP: u.totalXP,
        level: u.level,
        streak: u.streak,
        emailVerified: u.emailVerified,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({ message: 'Server error during admin users fetch' });
  }
});

// ─── PATCH /admin/users/:id/role ────────────────────────────────────────────
// Admin: promote/demote a user's role.
router.patch('/admin/users/:id/role', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const { role } = req.body;
    const allowed = ['guest', 'user', 'sub_admin', 'admin'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${allowed.join(', ')}` });
    }

    if (!isDbConnected()) {
      const user = mockUsers.find(u => u._id === req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.role = role;
      return res.json({ message: 'Role updated', id: user._id, role });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Role updated', id: user._id, role: user.role });
  } catch (error) {
    console.error('Admin role update error:', error);
    res.status(500).json({ message: 'Server error during role update' });
  }
});

export default router;
