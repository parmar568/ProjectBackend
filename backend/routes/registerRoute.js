const express = require("express");
const router = express.Router();

const { registerUser, updateUserProfile } = require("../controllers/registerController");
const User = require("../models/RegisterModel");

router.post("/register", registerUser);

// UPDATE USER PROFILE
router.put("/users/update/:id", updateUserProfile);

// GET ALL USERS (Admin)
router.get("/users/all", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE USER
router.delete("/users/delete/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;