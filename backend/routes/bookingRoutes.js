const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const User = require("../models/RegisterModel");
const Location = require("../models/ParkingLocation");

// GET DASHBOARD STATS
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    // Optimization: Use projection to only get necessary fields
    const allBookings = await Booking.find().lean();
    
    // Summary data - include all paid bookings across all time
    const totalRevenue = allBookings.reduce((sum, b) => {
      // Check for 'paid' status in various cases
      const isPaid = b?.paymentStatus?.toLowerCase() === "paid" || b?.status?.toLowerCase() === "completed";
      if (isPaid) {
        const rawAmount = Number(b.amount) || 0;
        const extraCharge = Number(b.extraCharge) || 0;
        return sum + rawAmount + extraCharge;
      }
      return sum;
    }, 0);

    const totalBookings = await Booking.countDocuments();
    
    // Slots calculation
    const locations = await Location.find({}, { totalSlots: 1, availableSlots: 1 }).lean();
    
    // Auto-fix any inconsistent slot counts based on REAL active bookings
    for (const loc of locations) {
      const activeBookingsAtLocation = await Booking.countDocuments({
        locationId: loc._id,
        status: { $in: ["Allocated", "Extended"] }
      });
      
      const realAvailableSlots = loc.totalSlots - activeBookingsAtLocation;
      
      if (loc.availableSlots !== realAvailableSlots) {
        await Location.findByIdAndUpdate(loc._id, { availableSlots: realAvailableSlots });
        loc.availableSlots = realAvailableSlots; // Update local copy for current response
      }
    }

    const totalParkingSlots = locations.reduce((sum, l) => sum + (l.totalSlots || 0), 0);
    const availableSlots = locations.reduce((sum, l) => sum + (l.availableSlots || 0), 0);
    const bookedSlots = totalParkingSlots - availableSlots;

    // Today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBookingsCount = await Booking.countDocuments({
      createdAt: { $gte: today }
    });

    // --- REAL DATA AGGREGATION ---

    // 1. Monthly Booking Graph (Real data from DB)
    const monthlyData = await Booking.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyBookings = monthlyData.map(item => ({
      month: monthNames[item._id - 1],
      bookings: item.count
    }));

    // 2. Daily Revenue Graph for Current Month (Real data from DB)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const dailyRevenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          $or: [
            { paymentStatus: { $in: ["Paid", "paid"] } },
            { status: { $in: ["Completed", "completed"] } }
          ]
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          total: { $sum: { $add: ["$amount", { $ifNull: ["$extraCharge", 0] }] } }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill in missing days for the chart
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const revenueTrends = []; // This is the variable name we'll use everywhere!
    for (let i = 1; i <= daysInMonth; i++) {
      const dayData = dailyRevenueData.find(d => d._id === i);
      revenueTrends.push({
        day: i,
        revenue: dayData ? dayData.total : 0
      });
    }

    // 3. Slot Usage Graph (Real data from DB)
    const slotUsage = [
      { name: "Available", value: availableSlots },
      { name: "Booked", value: bookedSlots }
    ];

    // 4. Hourly Parking Usage (Real data from DB)
    const hourlyData = await Booking.aggregate([
      {
        $project: {
          hour: { $hour: "$createdAt" }
        }
      },
      {
        $group: {
          _id: "$hour",
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const hourlyUsage = hourlyData.map(item => ({
      time: `${item._id}:00`,
      usage: item.count
    }));

    // If arrays are empty, provide at least one entry so charts don't break
    if (monthlyBookings.length === 0) monthlyBookings.push({ month: monthNames[new Date().getMonth()], bookings: 0 });
    if (revenueTrends.length === 0) revenueTrends.push({ day: 1, revenue: 0 }); // Now using revenueTrends here!
    if (hourlyUsage.length === 0) hourlyUsage.push({ time: "12:00", usage: 0 });

    res.status(200).json({
      summary: {
        totalParkingSlots: Number(totalParkingSlots) || 0,
        availableSlots: Number(availableSlots) || 0,
        bookedSlots: Number(bookedSlots) || 0,
        todayBookings: Number(todayBookingsCount) || 0,
        totalBookings: Number(totalBookings) || 0,
        totalRevenue: Number(totalRevenue) || 0,
        revenueTrend: "+0%", // Trends can be calculated if history exists
        bookingTrend: "+0%",
        availableTrend: "0%",
      },
      charts: {
        monthlyBookings: monthlyBookings || [],
        revenueTrends: revenueTrends || [], // Using same variable name everywhere!
        slotUsage: slotUsage || [],
        hourlyUsage: hourlyUsage || []
      },
      recentBookings: await Booking.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "name email")
    });
  } catch (error) {
    console.error("STATS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/book-slot", async (req, res) => {
  try {
    const {
      userId,
      slotNumber,
      startTime,
      endTime,
      amount,
      locationId,
      vehicleNumber,
      vehicleType,
      city,
      area
    } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Prevent Double Booking
    const overlappingBooking = await Booking.findOne({
      locationId,
      slotNumber,
      status: { $in: ["Allocated", "Extended"] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({ message: "This slot is already booked for the selected time range." });
    }

    const newBooking = new Booking({
      userId,
      slotNumber,
      startTime: start,
      endTime: end,
      amount,
      locationId,
      vehicleNumber,
      vehicleType,
      city,
      area,
      status: "Allocated"
    });

    await newBooking.save();

    // Update user's vehicle details in their profile every time they book
    if (userId && (vehicleNumber || vehicleType)) {
      await User.findByIdAndUpdate(userId, {
        vehicleNumber: vehicleNumber,
        vehicleType: vehicleType
      });
    }

    // Update location available slots
    await Location.findByIdAndUpdate(locationId, { $inc: { availableSlots: -1 } });

    res.status(201).json({ message: "Booking created successfully", booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/extend-booking", async (req, res) => {
  try {
    const { bookingId, extraAmount, paymentMethod, paymentStatus } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Ensure booking can only be extended if it's "Allocated" (not already extended or completed)
    if (booking.status !== "Allocated") {
      return res.status(400).json({ message: "Booking has already been extended or is no longer active." });
    }

    // Extend by 1 hour
    const newEndTime = new Date(booking.endTime.getTime() + 60 * 60 * 1000);

    // Check if the slot is still available for the extended time
    const overlappingBooking = await Booking.findOne({
      _id: { $ne: bookingId },
      locationId: booking.locationId,
      slotNumber: booking.slotNumber,
      status: { $in: ["Allocated", "Extended", "Pending"] },
      $or: [
        { startTime: { $lt: newEndTime }, endTime: { $gt: booking.endTime } }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({ message: "Cannot extend booking. Slot is already booked for the next hour." });
    }

    booking.endTime = newEndTime;
    // Keep original amount, track extension separately
    booking.extensionAmount = (booking.extensionAmount || 0) + (extraAmount || 0);
    // Update total amount for stats and simple display
    booking.amount += extraAmount || 0; 
    
    booking.status = "Extended";
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    
    // Generate unique 8-character token if payment is paid
    if (paymentStatus === "Paid" && !booking.paymentToken) {
      const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
      booking.paymentToken = `PK-${randomChars}`;
    }

    await booking.save();

    res.status(200).json({ message: "Booking extended successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/active-bookings", async (req, res) => {
  try {
    const bookings = await Booking.find({ status: { $in: ["Allocated", "Extended"] } }).populate("userId", "name");
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/admin/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("userId", "name email").sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/check-availability", async (req, res) => {
  try {
    const { locationId, date, startTime, endTime } = req.body;
    const location = await Location.findById(locationId);
    if (!location) return res.status(404).json({ message: "Location not found" });

    const totalSlots = location.totalSlots;
    
    // Convert strings to Date objects for precise comparison
    const start = new Date(`${date}T${startTime}`);
    let finalEndTime = endTime;
    if (!finalEndTime) {
      const [hours, minutes] = startTime.split(":").map(Number);
      finalEndTime = `${((hours + 1) % 24).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }
    const end = new Date(`${date}T${finalEndTime}`);

    const existingBookings = await Booking.find({
      locationId,
      date,
      status: { $in: ["Allocated", "Extended", "allocated", "extended", "Pending", "pending"] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    }).populate("userId", "name vehicleNumber");

    const bookedSlotsData = existingBookings.map(b => ({
      slotNumber: b.slotNumber,
      status: b.status,
      userName: b.userId?.name || "Unknown",
      vehicleNumber: b.vehicleNumber || b.userId?.vehicleNumber || "N/A",
      time: `${b.startTime} - ${b.endTime}`
    }));

    res.status(200).json({ 
      available: bookedSlotsData.length < totalSlots, 
      bookedSlots: bookedSlotsData.filter(s => s.status !== "Pending").map(s => s.slotNumber), 
      pendingSlots: bookedSlotsData.filter(s => s.status === "Pending").map(s => s.slotNumber),
      bookedSlotsDetails: bookedSlotsData,
      totalSlots 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/add", async (req, res) => {
  try {
    const {
      userId,
      vehicleNumber,
      vehicleType,
      city,
      area,
      parkingRate,
      paymentMethod,
      date,
      startTime,
      endTime,
      locationId,
      slotNumber,
      amount
    } = req.body;

    const location = await Location.findById(locationId);
    if (!location) return res.status(404).json({ message: "Location not found" });

    // Convert strings to Date objects for precise comparison
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Check if the requested slot is already booked
    const existingBooking = await Booking.findOne({
      locationId,
      date,
      slotNumber,
      status: { $in: ["Allocated", "Extended", "allocated", "extended", "Pending", "pending"] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ message: "This slot is already booked for the selected time" });
    }

    if (location.availableSlots <= 0) {
      return res.status(400).json({ message: "No slots available at this location" });
    }

    const newBooking = new Booking({
      userId,
      vehicleNumber,
      vehicleType,
      city,
      area,
      parkingRate,
      paymentMethod,
      date,
      startTime: start,
      endTime: end,
      slotNumber,
      locationId,
      amount,
      status: req.body.status || "Allocated", // Use provided status or default to Allocated
      paymentStatus: paymentMethod === "Cash" ? "Pending" : "Pending"
    });

    // Decrease the available slots in the location
    location.availableSlots -= 1;
    await location.save();

    await newBooking.save();

    // Update user's vehicle details in their profile every time they book
    if (userId && (vehicleNumber || vehicleType)) {
      await User.findByIdAndUpdate(userId, {
        vehicleNumber: vehicleNumber,
        vehicleType: vehicleType
      });
    }

    res.status(201).json({ 
      message: "Booking Confirmed & Slot Allocated Successfully", 
      slotNumber,
      bookingId: newBooking._id
    });

  } catch (error) {
    console.log("BOOKING ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/pay-overtime", async (req, res) => {
  try {
    const { bookingId, paymentMethod, paymentStatus, extraCharge } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    
    // extraCharge is already being updated by the cron job, 
    // but we can ensure the latest value is saved if passed.
    if (extraCharge !== undefined) {
      // If payment is paid, we want to "lock" this extra charge
      booking.extraCharge = extraCharge;
    }

    // Generate unique 8-character token if payment is paid
    if (paymentStatus === "Paid" && !booking.paymentToken) {
      const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
      booking.paymentToken = `PK-${randomChars}`;
    }

    // Finalize the booking when overtime is paid or committed (Cash/Online)
    // This stops the overtime counter and releases the slot
    const oldStatus = booking.status;
    booking.status = "Completed";

    // If it was paid online, we mark it. If cash, it stays pending until admin confirms at exit.
    await booking.save();

    // Release the slot if it was active
    if (["Allocated", "Extended", "Overtime"].includes(oldStatus)) {
      const location = await Location.findById(booking.locationId);
      if (location) {
        location.availableSlots = Math.min(location.totalSlots, location.availableSlots + 1);
        await location.save();
      }
    }

    res.status(200).json({ message: "Overtime payment confirmed and booking completed", booking });
  } catch (error) {
    console.log("PAY OVERTIME ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/auto-confirm-payment", async (req, res) => {
  try {
    const { bookingId, paymentApp } = req.body;
    if (!bookingId) return res.status(400).json({ message: "Booking ID is required" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Generate unique 8-character token PK-XXXXX
    const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
    const token = `PK-${randomChars}`;

    booking.paymentStatus = "Paid";
    booking.paymentToken = token;
    booking.status = "Allocated"; // Update status to Allocated when paid
    if (paymentApp) booking.paymentApp = paymentApp;
    
    await booking.save();

    res.status(200).json({
      message: "Payment Successful",
      paymentToken: token
    });
  } catch (error) {
    console.error("AUTO CONFIRM ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET ALL BOOKINGS BY LOCATION ID (For Admin Slot Visualization)
router.get("/by-location/:locationId", async (req, res) => {
  try {
    const { locationId } = req.params;
    console.log("Fetching bookings for locationId:", locationId);
    
    const location = await Location.findById(locationId);
    if (!location) {
      console.log("Location not found for ID:", locationId);
      return res.status(404).json({ message: "Location not found" });
    }

    console.log("Found Location:", location.city, location.area, "Total Slots:", location.totalSlots);

    const actualTotalSlots = location.totalSlots || 10;

    // Find ONLY ACTIVE bookings by locationId OR (city AND area) to capture old bookings
    const bookings = await Booking.find({ 
      $or: [
        { locationId },
        { city: location.city, area: location.area }
      ],
      status: { $in: ["Allocated", "Extended", "allocated", "extended", "Pending", "pending"] }
    }).populate("userId", "name vehicleNumber phone");

    console.log(`Found ${bookings.length} active bookings`);

    const result = {
      totalSlots: actualTotalSlots,
      bookings: bookings.map(b => ({
        slotNumber: b.slotNumber || 1,
        userName: b.userId?.name || "Unknown",
        vehicleNumber: b.vehicleNumber || b.userId?.vehicleNumber || "N/A",
        date: b.date,
        time: `${b.startTime || 'N/A'} - ${b.endTime || 'N/A'}`
      }))
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in by-location route:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET ALL BOOKINGS (Admin)
router.get("/all", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("userId", "name email phone vehicleNumber vehicleType");
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET USER BOOKINGS
router.get("/user/:userId", async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CHECK FOR PENDING PAYMENTS (Only blocks for Online/Card payments)
router.get("/user-pending-payment/:userId", async (req, res) => {
  try {
    const pendingPayment = await Booking.findOne({
      userId: req.params.userId,
      paymentStatus: "Pending",
      paymentMethod: "Online", // Only block for pending ONLINE payments
      status: { $in: ["Completed", "Allocated", "Extended"] }
    });
    
    if (pendingPayment) {
      return res.status(200).json({ 
        hasPending: true, 
        amount: pendingPayment.amount + (pendingPayment.extraCharge || 0),
        bookingId: pendingPayment._id 
      });
    }
    
    res.status(200).json({ hasPending: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE BOOKING STATUS & DISTANCE (Admin Action)
router.put("/update-status/:id", async (req, res) => {
  try {
    const { status, distance, mapUrl, extraCharge } = req.body;
    
    const oldBooking = await Booking.findById(req.params.id);
    if (!oldBooking) return res.status(404).json({ message: "Booking not found" });

    const updateData = { status, distance, mapUrl };
    if (extraCharge !== undefined) {
      updateData.extraCharge = extraCharge;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Only increment slots if we are moving FROM an active state TO a terminal state
    const isActive = (s) => ["Allocated", "Extended", "Overtime", "Pending"].includes(s);
    const isTerminal = (s) => ["Completed", "Rejected", "Expired"].includes(status);

    if (isActive(oldBooking.status) && isTerminal(status)) {
      const location = await Location.findById(updatedBooking.locationId);
      if (location) {
        location.availableSlots = Math.min(location.totalSlots, location.availableSlots + 1);
        await location.save();
      }
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE PAYMENT STATUS
router.put("/update-payment/:id", async (req, res) => {
  try {
    const { paymentStatus, paymentToken, paymentMethod, status } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    let updateFields = { paymentStatus };
    if (paymentToken) updateFields.paymentToken = paymentToken;
    if (paymentMethod) updateFields.paymentMethod = paymentMethod;
    if (status) updateFields.status = status;

    // Auto-allocate slot if admin marks as Paid and booking is somehow still Pending
    // Only decrement slot if NOT coming from Pending (Pending already decremented when created)
    if (paymentStatus === "Paid" && (booking.status === "Pending" || status === "Allocated")) {
      updateFields.status = "Allocated";

      // Only decrement if booking was NOT Pending (Pending already holds the slot when created)
      if (booking.status !== "Allocated" && booking.status !== "Pending") {
        const location = await Location.findById(booking.locationId);
        if (location && location.availableSlots > 0) {
          location.availableSlots -= 1;
          await location.save();
        }
      }
    }

    // Auto-complete if admin marks as Paid and booking is Overtime
    if (paymentStatus === "Paid" && booking.status === "Overtime") {
      updateFields.status = "Completed";

      const location = await Location.findById(booking.locationId);
      if (location) {
        location.availableSlots = Math.min(location.totalSlots, location.availableSlots + 1);
        await location.save();
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    res.status(200).json({ message: "Payment status updated", updatedBooking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE / CANCEL BOOKING
router.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Backend: Deleting booking ID:", id);
    
    const booking = await Booking.findById(id);
    if (!booking) {
      console.log("Backend: Booking not found");
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only increment available slots if the booking was active or pending lock
    // AND it hasn't already released the slot (i.e. not Completed/Rejected)
    const isActive = (s) => ["Allocated", "Extended", "allocated", "extended", "Pending", "pending", "Overtime", "overtime"].includes(s);
    if (booking.locationId && isActive(booking.status)) {
      const location = await Location.findById(booking.locationId);
      if (location) {
        location.availableSlots = Math.min(location.totalSlots, location.availableSlots + 1);
        await location.save();
        console.log("Backend: Incremented slots for location:", location.area);
      }
    }

    const deleted = await Booking.findByIdAndDelete(id);
    if (deleted) {
      console.log("Backend: Booking deleted successfully");
      return res.status(200).json({ message: "Booking Deleted Successfully" });
    } else {
      console.log("Backend: Failed to delete booking");
      return res.status(400).json({ message: "Could not delete booking" });
    }
  } catch (error) {
    console.error("Backend DELETE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;