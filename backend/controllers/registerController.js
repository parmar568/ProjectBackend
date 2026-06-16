const Register = require("../models/RegisterModel");

exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, vehicleNumber, vehicleType, password } = req.body;
    
    // Always trim and lowercase for clean data
    const cleanEmail = email.trim().toLowerCase();

    const newUser = new Register({
      name,
      email: cleanEmail,
      phone,
      vehicleNumber,
      vehicleType,
      password
    });

    await newUser.save();
    res.status(201).json({ message: "User Registered Successfully" });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: "Email Already Exists" });
    } else {
      res.status(500).json({ message: "Server Error" });
    }
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, vehicleNumber, vehicleType } = req.body;

    const updatedUser = await Register.findByIdAndUpdate(
      id,
      { name, email, phone, vehicleNumber, vehicleType },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile Updated Successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
};