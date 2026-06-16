const nodemailer = require("nodemailer");
require("dotenv").config();

const sendMail = async (to, subject, text) => {
  // Always create transporter inside the function to ensure process.env is ready
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn("==================================================");
    console.warn("⚠️  EMAIL NOT CONFIGURED IN backend/.env ⚠️");
    console.warn("Mocking email to:", to);
    console.warn("Subject:", subject);
    console.warn("Content:", text);
    console.warn("==================================================");
    // Return early to prevent Nodemailer from crashing with 'EAUTH'
    return { mock: true, message: "Email logged to console instead of sent." };
  }

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: to,
    subject: subject,
    text: text,
  };

  const result = await transporter.sendMail(mailOptions);
  return result;
};

module.exports = sendMail;
