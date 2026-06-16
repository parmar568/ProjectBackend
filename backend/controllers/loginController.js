const Admin = require("../models/AdminModel");
const User = require("../models/RegisterModel");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    
    const searchEmail = email.trim().toLowerCase();

    // 1️⃣ Check Admin First
    const admin = await Admin.findOne({ email: { $regex: new RegExp(`^\\s*${searchEmail}\\s*$`, 'i') } });

    if (admin) {
      if (admin.password === password) {
        const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });

        return res.status(200).json({
          message: "Admin Login Successful",
          role: "admin",
          token: token,
          user: { _id: admin._id, email: admin.email, name: "Admin" }
        });
      } else {
        return res.status(400).json({ message: "Invalid Password" });
      }
    }

    // 2️⃣ Check Normal User
    const user = await User.findOne({ email: { $regex: new RegExp(`^\\s*${searchEmail}\\s*$`, 'i') } });

    if (user) {
      if (user.password === password) {
        const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1d" });

        return res.status(200).json({
          message: "User Login Successful",
          role: "user",
          token: token,
          user: { 
            _id: user._id, 
            email: user.email, 
            name: user.name, 
            phone: user.phone, 
            vehicleNumber: user.vehicleNumber 
          }
        });
      } else {
        return res.status(400).json({ message: "Invalid Password" });
      }
    }

    return res.status(404).json({ message: "User Not Found" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.logout = async (req, res) => {
  try {
    // Session token will be removed from frontend, but here we could log the event.
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};