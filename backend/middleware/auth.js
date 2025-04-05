const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const admin = require('firebase-admin');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token missing'
            });
        }

        const token = authHeader.split(' ')[1];
        console.log('Token received:', token ? 'Present' : 'Missing');

        // First try JWT verification
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shoespot');
            console.log('Decoded token:', decoded);

            // Find user in database
            const user = await User.findById(decoded.id);
            if (!user) {
                throw new Error('User not found');
            }

            // Add user info to request
            req.user = user;
            req.userId = user._id;

            console.log('User authenticated:', {
                userId: user._id,
                email: user.email,
                name: user.name
            });

            next();
        } catch (jwtError) {
            // If JWT fails, try Firebase verification
            const decodedFirebase = await admin.auth().verifyIdToken(token);
            const user = await User.findOne({ email: decodedFirebase.email });
            
            if (!user) {
                throw new Error('User not found');
            }

            // Add user info to request
            req.user = user;
            req.userId = user._id;
            req.token = token;

            console.log('User authenticated via token:', {
                userId: user._id,
                email: user.email,
                name: user.name
            });

            next();
        }
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};

module.exports = protect;