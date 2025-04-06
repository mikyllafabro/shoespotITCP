const upload = require('../utils/multer');
const { admin, db } = require('../utils/firebaseConfig');
const User = require('../models/UserModel.js');
const cloudinary = require('../utils/cloudinary');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  const { name, email, password, role, status, userImage, cloudinary_id } = req.body;
    // const imageFile = req.file;

    try {
    // 1. First create the user in Firebase Authentication
    const firebaseUser = await admin.auth().createUser({
      email: email,
      password: password, // Firebase will handle the password hashing
      displayName: name
    });

    await db.collection('users').doc(firebaseUser.uid).set({
      name: name,
      email: email,
      status: status || 'active',
      avatarURL: userImage || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

      // Hash the password before saving to MongoDB
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user document
      const newUser = new User({
          name,
          email,
          password: hashedPassword, // Save the hashed password
          firebaseUid: firebaseUser.uid, // Generate a fake UID,
          role: role || 'user',
          status: status || 'active',
          userImage,
          cloudinary_id,
      });

      await newUser.save();

      res.status(201).json({ message: 'User registered successfully in MongoDB.',
        user: {
          id: newUser._id,
          firebaseUid: firebaseUser.uid,
          name,
          email,
          role: newUser.role
        }
       });
  } catch (error) {
      console.error('Error saving user to MongoDB:', error.message);

      // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Email already exists in Firebase' });
    }
    
    // If we created a Firebase user but failed to save in MongoDB, clean up the Firebase user
    if (error.message.includes('MongoDB') && req.firebaseUid) {
      try {
        await admin.auth().deleteUser(req.firebaseUid);
        console.log('Cleaned up Firebase user after MongoDB error');
      } catch (cleanupError) {
        console.error('Failed to clean up Firebase user:', cleanupError);
      }
    }
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, fcmToken } = req.body;

  try {
    console.log(`[Auth] Login attempt - Email: ${email}`);
    console.log(`[Auth] Received FCM token:`, fcmToken);
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`[Auth] User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Handle FCM token update
    if (fcmToken) {
      console.log('[Auth] Updating FCM token for user:', email);
      
      // Remove token from other users
      const existingTokenUsers = await User.find({ fcmToken });
      if (existingTokenUsers.length > 0) {
        console.log(`[Auth] Clearing token from ${existingTokenUsers.length} other users`);
        await User.updateMany({ fcmToken }, { $set: { fcmToken: null } });
      }

      // Update current user's token
      user.fcmToken = fcmToken;
      await user.save();
      console.log('[Auth] FCM token updated successfully');
    } else {
      console.log('[Auth] No FCM token provided');
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'shoespot',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        userImage: user.userImage,
        fcmToken: user.fcmToken
      }
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Clear FCM token
    await User.findByIdAndUpdate(userId, { fcmToken: null });
    console.log('Cleared FCM token for user:', userId);
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};

// Controller function to handle user login
exports.checkEmail = async (req, res) => {
  const { email } = req.params;

  try {
    // Check if user exists in Firebase Authentication
    const userRecord = await admin.auth().getUserByEmail(email.trim().toLowerCase());
    return res.status(200).json({ exists: true, uid: userRecord.uid });
  } catch (error) {
    // If the user doesn't exist in Firebase, return false
    if (error.code === 'auth/user-not-found') {
      return res.status(200).json({ exists: false });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { email } = req.params;

  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email.trim().toLowerCase());
    
    // Delete the user from Firebase Authentication
    await admin.auth().deleteUser(userRecord.uid);

    return res.status(200).json({ message: `User with email ${email} deleted successfully` });
  } catch (error) {
    // Handle errors (user not found or other issues)
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { email, password, name } = req.body;
  const userId = req.user.uid; // Assuming user ID is available in req.user
  try {
    // Update user details in Firebase Authentication
    const userRecord = await admin.auth().updateUser(userId, {
      email,
      password,
      displayName: name,
    });
    // Respond with success message and updated user details
    res.status(200).json({ message: 'User updated successfully', user: userRecord });
  } catch (error) {
    // Respond with error message if user update fails
    res.status(400).json({ message: error.message });
  }
};

// Controller function to handle password reset
exports.resetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Generate a password reset link for the given email
    const link = await admin.auth().generatePasswordResetLink(email);
    // Send the link to the user's email address
    // You can use a service like SendGrid, Mailgun, etc. to send the email
    res.status(200).json({ message: 'Password reset email sent. Please check your inbox.', link });
  } catch (error) {
    // Respond with error message if password reset fails
    res.status(400).json({ message: error.message });
  }
};

exports.uploadAvatar = [
  upload.single('image'),
  async (req, res) => {
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    try {
      // Upload image to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(imageFile.path, { folder: 'user_images' });
      const imageUrl = uploadResponse.secure_url;

      res.status(201).json({ message: 'Image uploaded successfully', secure_url: imageUrl });
    } catch (error) {
      console.error("Error during image upload:", error.message);
      res.status(400).json({ message: error.message });
    }
  }
];

exports.getCurrentUser = async (req, res) => {
  try {
    // Get user from protect middleware
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get complete user data from MongoDB
    const mongoUser = await User.findById(user._id);
    if (!mongoUser) {
      return res.status(404).json({ message: "User not found in database" });
    }

    const userData = {
      _id: mongoUser._id,
      name: mongoUser.name,
      email: mongoUser.email,
      status: mongoUser.status,
      role: mongoUser.role,
      userImage: mongoUser.userImage,
      mobileNumber: mongoUser.mobileNumber,
      address: mongoUser.address
    };

    res.status(200).json({
      message: "User data retrieved successfully",
      user: userData
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
};

exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Attach the decoded user to the request
    next();
  } catch (error) {
    console.error('Error verifying ID token:', error.message);
    return res.status(403).json({ message: 'Failed to verify token', error: error.message });
  }
};

exports.getUserData = async (req, res) => {
  const { uid } = req.user;

  try {
      // Fetch from Firestore
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
          console.error('Firestore: No such document for UID:', uid);
          return res.status(404).json({ message: 'User not found in Firestore.' });
      }
      const firestoreData = userDoc.data();
      console.log('Fetched Firestore data:', firestoreData);

      // Fetch from MongoDB
      const mongoUser = await User.findOne({ firebaseUid: uid });
      if (!mongoUser) {
          console.error('MongoDB: No user found for UID:', uid);
          return res.status(404).json({ message: 'User not found in MongoDB.' });
      }
      console.log('Fetched MongoDB data:', mongoUser);

      // Combine the data
      const userData = {
          ...firestoreData,
          ...mongoUser.toObject(),
      };

      res.status(200).json({ user: userData });
  } catch (error) {
      console.error('Error fetching user data:', error.message);
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.addToOrderList = async (req, res) => {
  try {
    const { userId, product_id, quantity } = req.body;

    if (!userId || !product_id || !quantity) {
      return res.status(400).json({ message: 'User ID, product ID, and quantity are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if the product is already in the order list
    const existingItem = user.orderlist.find(
      item => item.product_id.toString() === product_id.toString()
    );

    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity += quantity;
    } else {
      // Add new item to the order list
      user.orderlist.push({ product_id, quantity });
    }

    await user.save();
    res.status(200).json({ message: 'Item added to order list successfully.', orderlist: user.orderlist });
  } catch (error) {
    console.error('Error adding to order list:', error);
    res.status(500).json({ message: 'Failed to add item to order list.' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Fetch from MongoDB
    const mongoUsers = await User.find();
    
    // Fetch from Firestore
    const firestoreSnapshot = await db.collection('users').get();
    const firestoreUsers = firestoreSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Combine the data
    const allUsers = [...mongoUsers.map(user => user.toObject()), ...firestoreUsers];
    
    res.status(200).json({ message: 'Users fetched successfully.', users: allUsers });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ message: 'Failed to fetch users.', error: error.message });
  }
};

exports.updateFcmToken = async (req, res) => {
  try {
    console.log('[FCM] Updating token for user:', req.user?._id);
    console.log('[FCM] Received token:', req.body.fcmToken);

    const { fcmToken } = req.body;
    const userId = req.user._id;

    // Clear token from other users first
    if (fcmToken) {
      await User.updateMany(
        { fcmToken: fcmToken },
        { $set: { fcmToken: null } }
      );
      console.log('[FCM] Cleared token from other users');
    }

    // Update user's token
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        fcmToken,
        deviceType: req.body.deviceType || null,
        lastLogin: new Date()
      },
      { new: true }
    );

    if (!updatedUser) {
      console.log('[FCM] User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[FCM] Token updated successfully');
    return res.status(200).json({ 
      success: true,
      message: fcmToken ? 'FCM token updated' : 'FCM token removed',
      user: {
        id: updatedUser._id,
        fcmToken: updatedUser.fcmToken
      }
    });

  } catch (error) {
    console.error('[FCM] Update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update FCM token',
      error: error.message
    });
  }
};

exports.syncUser = async (req, res) => {
  try {
    const { email, name, photo, uid, googleId } = req.body;
    
    console.log('Received sync request for:', email);

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required for user sync' 
      });
    }

    // Check if user exists in MongoDB
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user if not found
      user = new User({
        email,
        name: name || email.split('@')[0],
        firebaseUid: uid,
        googleId: googleId || uid,
        userImage: photo,
        role: 'user',
        status: 'active'
      });
      
      await user.save();
      console.log('Created new user during sync:', email);
    } else {
      // Update existing user
      user.name = name || user.name;
      user.firebaseUid = uid || user.firebaseUid;
      user.googleId = googleId || user.googleId || uid;
      if (photo) user.userImage = photo;
      user.lastSyncedAt = new Date();
      
      await user.save();
      console.log('Updated existing user during sync:', email);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'shoespot',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        userImage: user.userImage,
        firebaseUid: user.firebaseUid,
        googleId: user.googleId
      }
    });
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({
      success: false,
      message: 'User sync failed',
      error: error.message
    });
  }
};

// Update the googleLogin function to properly handle Google authentication
exports.googleLogin = async (req, res) => {
  try {
    // Extract data from request
    const { idToken, user } = req.body;
    
    console.log('Received Google login request:', {
      email: user?.email,
      name: user?.name,
      hasIdToken: !!idToken
    });

    // Check if we have required user data
    if (!user || !user.email) {
      return res.status(400).json({
        success: false,
        message: 'User email is required'
      });
    }

    // Try to find the user in MongoDB
    let mongoUser = await User.findOne({ 
      $or: [
        { email: user.email },
        { googleId: user.googleId }
      ]
    });
    
    if (mongoUser) {
      console.log('Found existing user in MongoDB:', mongoUser.email);
      
      // Update the existing user with any new information
      if (user.photo && !mongoUser.userImage) mongoUser.userImage = user.photo;
      if (user.uid && !mongoUser.firebaseUid) mongoUser.firebaseUid = user.uid;
      if (user.googleId && !mongoUser.googleId) mongoUser.googleId = user.googleId;
      
      // Update other fields if needed
      mongoUser.name = user.name || mongoUser.name;
      mongoUser.lastLogin = new Date();
      
      await mongoUser.save();
      console.log('Updated existing user data');
    } else {
      // User doesn't exist, create a new one
      console.log('Creating new user in MongoDB:', user.email);
      
      mongoUser = new User({
        email: user.email,
        name: user.name || user.email.split('@')[0],
        firebaseUid: user.uid,
        googleId: user.googleId,
        userImage: user.photo,
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await mongoUser.save();
      console.log('New user created in MongoDB:', user.email);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: mongoUser._id,
        email: mongoUser.email,
        role: mongoUser.role 
      },
      process.env.JWT_SECRET || 'shoespot',
      { expiresIn: '7d' }
    );

    // Return success response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: mongoUser._id,
        email: mongoUser.email,
        name: mongoUser.name,
        role: mongoUser.role,
        status: mongoUser.status,
        userImage: mongoUser.userImage,
        firebaseUid: mongoUser.firebaseUid,
        googleId: mongoUser.googleId
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  }
};

exports.removeFcmToken = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user and clear FCM token
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          fcmToken: null,
          deviceType: null 
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'FCM token removed successfully' });
  } catch (error) {
    console.error('Error removing FCM token:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};