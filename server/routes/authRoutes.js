const express = require("express");
const { signup, login } = require("../controllers/authController.js");
// const { verifyUser } = require("../middleware/auth.js");
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
// router.post("/logout", verifyUser, logout);

// router.post("/forgot-password", forgotPassword);
// router.post("/reset-password", resetPassword);

// router.get("/profile", verifyUser, getProfile);
// router.put("/profile/update", verifyUser, updateProfile);

// router.get("/admin-dashboard", verifyUser, verifyAdmin, (req, res) => {
//     res.json({ message: "Welcome, Admin!" });
// });

module.exports = router;