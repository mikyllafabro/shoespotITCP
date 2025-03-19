const bcrypt = require("bcrypt");
const UserModel = require("../models/User.js");
const jwt = require("jsonwebtoken");

// const { sendOtpEmail, sendPasswordResetEmail } = require("../utils/mailer.js"); 

const signup = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user without OTP fields
        const newUser = new UserModel({ 
            fullname, 
            email,
            password: hashedPassword,
        });
        
        // Save user to database
        await newUser.save();

        // Return success response
        res.status(201).json({ message: "User created successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        console.log("Login attempt received:", req.body.email);
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email
        const user = await UserModel.findOne({ email });
        console.log("User found:", user ? "Yes" : "No");

        // Check if user exists
        if (!user) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        // Compare passwords - using try/catch to catch bcrypt errors
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid Email or Password" });
            }
        } catch (bcryptError) {
            console.error("bcrypt error:", bcryptError);
            return res.status(500).json({ message: "Authentication error", details: bcryptError.message });
        }

        // Generate JWT Token
        try {
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );
            return res.status(200).json({
                status: "ok",
                data: {
                    token,
                    user: {
                        id: user._id,
                        fullname: user.fullname,
                        email: user.email,
                    }
                }
            });
        } catch (jwtError) {
            console.error("JWT generation error:", jwtError);
            return res.status(500).json({ message: "Token generation failed", details: jwtError.message });
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ 
            message: "An error occurred during login", 
            details: error.message 
        });
    }
};

// const logout = (req, res) => {
//     if (req.session) {
//         req.session.destroy(err => {
//             res.status(err ? 500 : 200).json(err ? "Failed to logout" : "Logged out successfully");
//         });
//     } else {
//         res.status(400).json({ error: "No session found" });
//     }
// };

// const getProfile = async (req, res) => {
//     try {
//         // ✅ Get token from request headers
//         const token = req.headers.authorization?.split(" ")[1];

//         if (!token) {
//             return res.status(401).json({ message: "No token provided" });
//         }

//         // ✅ Verify the token
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
//         // ✅ Find user in the database (excluding password)
//         const user = await UserModel.findById(decoded.id).select("-password");

//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         res.status(200).json(user);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching profile" });
//     }
// };

// const updateProfile = async (req, res) => {
//     try {
//       const { currentPassword, fullname, email, newPassword } = req.body;
//       const userId = req.user.id; // From your auth middleware
      
//       console.log("Profile update request received for user:", userId);
  
//       // Find the user
//       const user = await UserModel.findById(userId);
//       if (!user) {
//         return res.status(404).json({ error: "User not found" });
//       }
  
//       // Verify current password
//       const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
//       if (!isPasswordValid) {
//         return res.status(401).json({ error: "Current password is incorrect" });
//       }
  
//       // Update the fields if provided
//       if (fullname) user.fullname = fullname;
//       if (username) {
//         // Check if username is taken by another user
//         const existingUser = await UserModel.findOne({ 
//           username, 
//           _id: { $ne: userId } 
//         });
        //delete username here
//         if (existingUser) {
//           return res.status(400).json({ error: "Username is already taken" });
//         }
        
//         user.username = username;
//       }
      
//       if (email) {
//         // Check if email is taken by another user
//         const existingUser = await UserModel.findOne({ 
//           email, 
//           _id: { $ne: userId } 
//         });
        
//         if (existingUser) {
//           return res.status(400).json({ error: "Email is already taken" });
//         }
        
//         user.email = email;
//       }
  
//       // Update password if provided
//       if (newPassword) {
//         user.password = await bcrypt.hash(newPassword, 10);
//       }
  
//       // Save the updated user
//       await user.save();
  
//       // Generate a new token with the updated info
//       const token = jwt.sign(
//         { id: user._id, role: user.role },
//         process.env.JWT_SECRET,
//         { expiresIn: "7d" }
//       );
  
//       // Return success response with updated user info
//       res.status(200).json({
//         message: "Profile updated successfully",
//         token,
//         user: {
//           id: user._id,
//           name: user.name,
//           username: user.username,
//           email: user.email,
//           role: user.role,
//           status: user.status,
//           isVerified: user.isVerified
//         }
//       });
//     } catch (error) {
//       console.error("Profile update error:", error);
//       res.status(500).json({ 
//         error: "Error updating profile", 
//         details: error.message 
//       });
//     }
//   };


module.exports = { signup, login };