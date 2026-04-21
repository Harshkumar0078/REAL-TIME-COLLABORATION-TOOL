const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({
        error:
          existingUser.email === email
            ? 'Email already registered.'
            : 'Username already taken.',
      });
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/guest
const guestLogin = async (req, res) => {
  try {
    const guestName = 'Guest_' + uuidv4().substr(0, 6).toUpperCase();
    const guestEmail = `${guestName.toLowerCase()}@guest.codesync.app`;
    const guestPassword = uuidv4();

    const user = await User.create({
      username: guestName,
      email: guestEmail,
      password: guestPassword,
      isGuest: true,
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        isGuest: true,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      isGuest: req.user.isGuest,
    },
  });
};

module.exports = { register, login, guestLogin, getMe };
