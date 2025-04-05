const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const protect = require('../middleware/protect');
const User = require('../models/UserModel'); // Add this import

const {
    login,
    updateUser,
    resetPassword,
    uploadAvatar,
    getCurrentUser,
    signup,
    checkEmail,  
    deleteUser, 
    getUsers,
    getAllUsers,  
    updateFcmToken,
    googleLogin, // Add this import
    syncUser // Add this import for the sync-user route
} = require('../controllers/AuthController');


router.post('/signup', signup);
router.post('/login', login);
router.patch('/updateUser', auth, updateUser);
router.put('/updateUser', auth, updateUser);
router.post('/resetPassword', resetPassword);
router.post('/upload-avatar', uploadAvatar);
router.get('/me', auth, getCurrentUser);
router.get('/users', getUsers);
router.post('/update-fcm-token', protect, updateFcmToken);  // To update FCM tokena

router.get('/check-email/:email', checkEmail);  // To check if email exists
router.delete('/delete-user/:email', deleteUser);  // To delete user by email
router.get('/users', auth, getAllUsers);  // To get all users

// Add Google login route
router.post('/google-login', googleLogin);

// Add a route for sync-user with the correct controller function
router.post('/sync-user', syncUser);

router.put('/profile', auth, async (req, res) => {
  try {
    console.log('Profile update request body:', req.body);
    console.log('User ID from auth:', req.user._id);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields if provided
    if (req.body.name) user.name = req.body.name;
    if (req.body.mobileNumber) user.mobileNumber = req.body.mobileNumber;
    if (req.body.address) user.address = req.body.address;
    
    // Handle image update if provided
    if (req.body.image) {
      user.userImage = req.body.image;
    }

    const updatedUser = await user.save();
    console.log('Profile updated successfully:', updatedUser);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobileNumber,
        address: updatedUser.address,
        userImage: updatedUser.userImage
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating profile',
      error: error.message 
    });
  }
});

module.exports = router;