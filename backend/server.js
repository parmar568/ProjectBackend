require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const connectDB = require("./config/db");


const Admin = require("./models/AdminModel");
const Booking = require("./models/Booking");
const Location = require("./models/ParkingLocation");
const User = require("./models/RegisterModel");
const sendMail = require("./utils/sendMail");

const registerRoute = require("./routes/registerRoute");
const loginRoute = require("./routes/loginRoute");
const bookingRoutes = require("./routes/bookingRoutes");
const locationRoutes = require("./routes/locationRoutes");
const forgotPasswordRoute = require("./routes/forgotPasswordRoute");
const contactRoutes = require("./routes/contactRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authMiddleware = require("./middleware/authMiddleware");

// Connect to Database
if (!process.env.MONGO_URI) {
  console.log("WARNING: MONGO_URI environment variable not found! Using local MongoDB for testing!");
}
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ================= ROUTES =================
app.use("/api", registerRoute);
app.use("/api", loginRoute);
app.use("/api", forgotPasswordRoute);
app.use("/api/bookings", bookingRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/payments", paymentRoutes);

// Protected Route Example
app.get("/api/protected-route", authMiddleware, (req, res) => {
  res.status(200).json({ message: "Access granted to protected route", user: req.user });
});

// Default Route
app.get("/", (req, res) => {
  res.send("Parking Management System API is running... 🚀");
});

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok", message: "Backend is healthy and running perfectly!" });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  createAdmin();
  
  // 🔥 AUTO MIGRATION: Normalize all statuses to capitalized versions (only if MongoDB is connected!)
  try {
    // Check if mongoose is connected first
    if (mongoose.connection.readyState === 1) {
      await Booking.updateMany(
        { status: { $in: ["pending", "Pending"] } },
        { $set: { status: "Pending" } }
      );
      await Booking.updateMany(
        { status: { $in: ["allocated", "Allocated"] } },
        { $set: { status: "Allocated" } }
      );
      await Booking.updateMany(
        { status: { $in: ["extended", "Extended"] } },
        { $set: { status: "Extended" } }
      );
      await Booking.updateMany(
        { status: { $in: ["completed", "Completed"] } },
        { $set: { status: "Completed" } }
      );
      console.log("Status normalization migration completed.");
    } else {
      console.log("MongoDB not connected yet; skipping migration for now!");
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
});

// CRON JOB: Check for expired bookings every minute (only run if MongoDB is connected!)
cron.schedule("* * * * *", async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log("MongoDB not connected; skipping cron job!");
      return;
    }

    const now = new Date();
    
    // 1. Handle Active bookings: Start Overtime if time is up + 2 minutes grace
    const graceTime = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago
    const expiredBookings = await Booking.find({
      status: { $in: ["Allocated", "Extended"] },
      endTime: { $lte: graceTime }
    });

    for (const booking of expiredBookings) {
      booking.status = "Overtime";
      booking.paymentStatus = "Pending"; // Mark as pending when overtime starts
      await booking.save();
    }

    // 2. Handle Overtime calculations and notifications
    const overtimeBookings = await Booking.find({
      status: "Overtime",
      paymentStatus: { $ne: "Paid" } // Only update if not yet paid
    }).populate("userId");

    for (const booking of overtimeBookings) {
      // Calculate Extra Charge: Ceil to nearest hour
      const diffMs = now - booking.endTime;
      const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
      const rate = booking.parkingRate || 50;
      
      booking.extraCharge = diffHrs * rate;

      // Send Email after 20 minutes
      if (diffMs >= 20 * 60 * 1000 && !booking.overtimeEmailSent) {
        if (booking.userId && booking.userId.email) {
          const subject = "Parking Time Exceeded - Overtime Alert";
          const text = `Dear ${booking.userId.name},\n\nYour parking time for slot ${booking.slotNumber} has exceeded the limit. \n\nOvertime charges are now being applied (₹${rate}/hour). Please pick up your vehicle as soon as possible to avoid further charges.\n\nTotal Overtime Charge so far: ₹${booking.extraCharge}.\n\nThank you,\nSecure Parking Team`;
          
          await sendMail(booking.userId.email, subject, text);
          booking.overtimeEmailSent = true;
        }
      }
      
      await booking.save();
    }

    // 3. Handle Pending (Locked) or Unpaid Online bookings: 
    // Delete if not confirmed within 5 minutes (increased from 2 mins for better UX)
    const lockedTime = new Date(now.getTime() - 5 * 60 * 1000); 
    const expiredLocks = await Booking.find({
      $or: [
        { status: "Pending", createdAt: { $lte: lockedTime } },
        { status: "Allocated", paymentMethod: "Online", paymentStatus: "Pending", createdAt: { $lte: lockedTime } }
      ]
    });

    for (const lock of expiredLocks) {
      console.log(`Cron: Auto-cancelling unpaid/pending booking ${lock._id}`);
      await Booking.findByIdAndDelete(lock._id);
      if (lock.locationId) {
        await Location.findByIdAndUpdate(lock.locationId, {
          $inc: { availableSlots: 1 }
        });
      }
    }
  } catch (error) {
    console.error("Cron Job Error:", error);
  }
});


// ================= DEFAULT ADMIN =================

async function createAdmin() {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log("MongoDB not connected; skipping default admin creation!");
      return;
    }

    const existing = await Admin.findOne({ email: "admin@gmail.com" });

    if (!existing) {
      await Admin.create({
        email: "admin@gmail.com",
        password: "admin123"
      });
      console.log("Default admin created: admin@gmail.com / admin123");
    } else {
      console.log("Default admin already exists!");
    }

  } catch (error) {
    console.error("Error creating default admin:", error);
  }
}
