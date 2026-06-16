const express = require("express");
const router = express.Router();
const { checkEmail, verifyOTP, resetPasswordDirect } = require("../controllers/forgotPasswordController");

router.post("/check-email", checkEmail);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password-direct", resetPasswordDirect);

module.exports = router;
