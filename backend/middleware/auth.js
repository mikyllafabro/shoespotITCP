const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authorization token missing'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token ? 'Present' : 'Missing');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shoespot');
    console.log('Decoded token:', decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: 'User not found'
      });
    }

    // Add user info to request
    req.user = user;
    req.userId = user._id;
    
    console.log('User authenticated:', {
      userId: user._id,
      email: user.email
    });

    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = protect;