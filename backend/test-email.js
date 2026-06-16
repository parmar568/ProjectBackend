require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
  console.log("-----------------------------------------");
  console.log("Email User Being Used:", process.env.EMAIL_USER || process.env.GMAIL_USER);
  console.log("Email Pass Being Used:", (process.env.EMAIL_PASS || process.env.GMAIL_PASS) ? "***** (Loaded)" : "UNDEFINED");
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || process.env.GMAIL_USER,
      pass: process.env.EMAIL_PASS || process.env.GMAIL_PASS,
    },
  });

  try {
    console.log("Testing connection...");
    await transporter.verify();
    console.log("✅ Credentials are valid! Sending test email...");

    await transporter.sendMail({
      from: process.env.EMAIL_USER || process.env.GMAIL_USER,
      to: process.env.EMAIL_USER || process.env.GMAIL_USER, // Send to self
      subject: "Test Email Setup",
      text: "If you receive this, your email configuration is fully working!"
    });
    console.log("✅ Test email sent successfully! Please check your inbox.");
  } catch (error) {
    console.log("\n❌ ERROR SENDING EMAIL ❌");
    console.error(error.message);
    if (error.message.includes("Invalid login")) {
      console.log("\n💡 SOLUTION: Google does NOT allow standard passwords for security.");
      console.log("You MUST create a 16-character 'App Password' from your Google Account settings.");
      console.log("1. Go to https://myaccount.google.com/security");
      console.log("2. Turn on 2-Step Verification.");
      console.log("3. Search for 'App Passwords' and create one.");
      console.log("4. Paste the new 16-character password into your .env file.");
      console.log("5. Restart your backend server!");
    } else {
      console.log("\n💡 SOLUTION: Check your internet connection or email configuration.");
    }
  }
  console.log("-----------------------------------------");
};

testEmail();
