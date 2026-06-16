const mongoose = require("mongoose");

const RegisterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  vehicleNumber: { type: String },
  vehicleType: { type: String },
  password: { type: String, required: true },
  resetToken: { type: String },
  resetTokenExpiry: { type: Number }

}, { timestamps: true });

module.exports = mongoose.model("Register", RegisterSchema);