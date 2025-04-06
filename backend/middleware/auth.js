const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('[Auth] Checking token:', authHeader ? 'Present' : 'Missing');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token missing'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shoespot');
        console.log('[Auth] Decoded token:', decoded);

        // Find user and attach to request
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new Error('User not found');
        }

        req.user = user;
        req.token = token;

        next();
    } catch (error) {
        console.error('[Auth] Middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};

module.exports = protect;