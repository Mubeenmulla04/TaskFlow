import User from '../models/User.model.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async.middleware.js';

// @desc    Register user
// @route   POST /api/auth/signup
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  // First user becomes admin
  const userCount = await User.countDocuments();
  const assignedRole = userCount === 0 ? 'admin' : (role === 'admin' ? 'admin' : 'member');

  const user = await User.create({ name, email, password, role: assignedRole });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, createdAt: user.createdAt },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, createdAt: user.createdAt },
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (avatar !== undefined) updates.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated', user });
});

// @desc    Get all users (admin: for assigning tasks/members)
// @route   GET /api/auth/users
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true }).select('name email role avatar createdAt');
  res.json({ success: true, users });
});
