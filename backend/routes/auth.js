const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Register
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  // 🚫 Block teacher registration completely
  if (role === 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Teacher registration is not allowed'
    });
  }
  
  const existing = await User.findOne({ username, role });
  if (existing) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = new User({ username, password, role });
  await user.save();

  res.json({ message: 'Registered successfully' });
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 🔒 STRICT role check
    if (user.role !== role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // ✅ Credentials + role match
    res.json({
      success: true,
      role: user.role,
      username: user.username
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


module.exports = router;
