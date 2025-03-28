const { admin, db } = require('../utils/firebaseConfig');
const createError = require('../utils/error');

const auth = async (req, res, next) => {
  try {
    // Get token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Authorization header missing or invalid');
      return next(new createError('You are not logged in! Please log in to get access.', 401));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('Token is missing');
      return next(new createError('You are not logged in! Please log in to get access.', 401));
    }

    // Verify token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Decoded Token UID:', decodedToken.uid); // Log the decoded UID

    // Query Firestore for the user with the UID
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      console.error('No user found with the given UID in Firestore');
      return next(new createError('The user belonging to this token does no longer exist.', 401));
    }

    const currentUser = userDoc.data();
    console.log('Authenticated user:', currentUser); // Log the current user for debugging

    // Attach the user to the request object for use in subsequent routes
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Error in protect middleware:', error);
    return next(new createError('You are not logged in! Please log in to get access.', 401));
  }
};

module.exports = auth;