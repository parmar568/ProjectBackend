const express = require("express");
const router = express.Router();
const Contact = require("../models/ContactModel");
const sendMail = require("../utils/sendMail");

// Save Contact Request
router.post("/add", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();
    res.status(201).json({ message: "Message sent successfully! We will get back to you soon." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all Contact Requests
router.get("/all", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Reply to Contact Request
router.post("/reply", async (req, res) => {
  try {
    const { contactId, replyMessage } = req.body;
    const contact = await Contact.findById(contactId);
    if (!contact) return res.status(404).json({ message: "Contact request not found" });

    // Send Email
    const emailSubject = `Reply to your inquiry: ${contact.subject}`;
    const emailText = `Hello ${contact.name},\n\nThank you for reaching out to us. Here is our response to your message:\n\n"${replyMessage}"\n\nBest regards,\nSmart Parking Team`;
    
    await sendMail(contact.email, emailSubject, emailText);

    // Update Contact status
    contact.status = "replied";
    contact.replyMessage = replyMessage;
    await contact.save();

    res.status(200).json({ message: "Reply sent successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
