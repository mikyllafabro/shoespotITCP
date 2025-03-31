const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const createError = require('../utils/error');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authorization token missing'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token (not Firebase token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shoespot');
    
    // Find user in MongoDB
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: 'User not found'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({
      message: 'Authentication failed'
    });
  }
};

module.exports = auth;