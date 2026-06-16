const express = require("express");
const router = express.Router();
const Feedback = require("../models/FeedbackModel");

// Save Feedback
router.post("/add", async (req, res) => {
  try {
    const { userId, name, email, rating, comment } = req.body;
    const newFeedback = new Feedback({ userId, name, email, rating, comment });
    await newFeedback.save();
    res.status(201).json({ message: "Thank you for your valuable feedback!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all Feedback
router.get("/all", async (req, res) => {
  try {
    const feedback = await Feedback.find().populate("userId", "name email").sort({ createdAt: -1 });
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete Feedback
router.delete("/:id", async (req, res) => {
  try {
    console.log("Deleting feedback with ID:", req.params.id);
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      console.log("Feedback not found with ID:", req.params.id);
      return res.status(404).json({ message: "Feedback not found" });
    }
    console.log("Feedback deleted successfully");
    res.status(200).json({ message: "Feedback deleted successfully!" });
  } catch (error) {
    console.error("Error in delete feedback route:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
