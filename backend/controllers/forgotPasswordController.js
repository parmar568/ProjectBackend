const User = require("../models/RegisterModel");
const Admin = require("../models/AdminModel");
const Otp = require("../models/OtpModel");
const sendMail = require("../utils/sendMail");

// 1. Check if email exists in database and send OTP
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "Please enter your email address" });
    }

    const searchEmail = email.trim().toLowerCase();
    const emailRegex = new RegExp(`^\\s*${searchEmail}\\s*$`, 'i');

    const user = await User.findOne({ email: emailRegex });
    const admin = await Admin.findOne({ email: emailRegex });

    if (!user && !admin) {
      return res.status(404).json({ message: "Email does not match our records." });
    }

    const foundEmail = user ? user.email : admin.email;
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete any old OTPs for this email and save the new one
    await Otp.deleteMany({ email: foundEmail });
    await Otp.create({ email: foundEmail, otp });

    console.log(`[FORGOT_PWD] OTP for ${foundEmail}: ${otp}`);

    // Try sending email
    try {
      const subject = "Password Reset OTP - Secure Parking";
      const text = `Your OTP for password reset is: ${otp}. It is valid for 5 minutes. If you did not request this, please ignore this email.`;
      
      const emailResult = await sendMail(foundEmail, subject, text);
      
      if (emailResult && emailResult.mock) {
        console.log(`[FORGOT_PWD] Mock email for ${foundEmail}: ${otp}`);
        return res.status(200).json({ 
          message: "OTP sent to console (Email not configured in .env).",
          email: foundEmail,
          role: admin ? "admin" : "user",
          mock: true
        });
      }
      
      console.log(`[FORGOT_PWD] OTP email sent successfully to ${foundEmail}`);
      return res.status(200).json({ 
        message: "Success. OTP sent to your email.",
        email: foundEmail,
        role: admin ? "admin" : "user"
      });
      
    } catch (emailError) {
      console.error("[FORGOT_PWD] Email sending error:", emailError.message);
      
      // Still allow proceeding in development if it's an authentication error, 
      // but warn the user. In production, this should probably fail.
      if (process.env.NODE_ENV === "development") {
        return res.status(200).json({ 
          message: "Success (Development Mode). OTP could not be sent but is logged in server console.",
          email: foundEmail,
          role: admin ? "admin" : "user",
          devNote: "Check server console for OTP. Ensure you use a 16-character App Password for Gmail in .env"
        });
      }

      return res.status(500).json({ 
        message: "Failed to send OTP email. Please check your email configuration or try again later.",
        error: emailError.message 
      });
    }
  } catch (error) {
    console.error("[FORGOT_PWD] Check error:", error);
    res.status(500).json({ message: "Internal server error. Try again." });
  }
};

// 2. Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    
    // Find valid OTP
    const validOtp = await Otp.findOne({ email, otp });
    
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Optionally delete OTP so it can't be used twice
    await Otp.deleteMany({ email });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("[FORGOT_PWD] Verify OTP error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. Reset password directly
exports.resetPasswordDirect = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const lowerEmail = email.trim().toLowerCase();
    const emailRegex = new RegExp(`^\\s*${lowerEmail}\\s*$`, 'i');

    const user = await User.findOne({ email: emailRegex });
    const admin = await Admin.findOne({ email: emailRegex });
    
    if (!user && !admin) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password for whichever was found
    if (user) {
      await User.updateOne({ _id: user._id }, { $set: { password: newPassword } });
    } else if (admin) {
      await Admin.updateOne({ _id: admin._id }, { $set: { password: newPassword } });
    }

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
