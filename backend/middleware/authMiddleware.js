const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");
const User = require("../models/RegisterModel");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Not Authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify account exists
    let account;
    if (decoded.role === "admin") {
      account = await Admin.findById(decoded.id);
    } else {
      account = await User.findById(decoded.id);
    }

    if (!account) {
      return res.status(401).json({ message: "Account not found or session expired" });
    }

    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = authMiddleware;