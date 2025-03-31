const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const createError = require('../utils/error');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new createError('Authentication token missing', 401));
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token (not Firebase token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shoespot');

    // Find user using the decoded token data
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new createError('User not found', 401));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in protect middleware:', error);
    next(new createError('Authentication failed', 401));
  }
};

module.exports = protect;