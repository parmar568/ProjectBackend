const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Register"
  },
  vehicleNumber: String,
  vehicleType: String,
  city: String,
  area: String,
  parkingRate: Number,
  paymentMethod: String,
 paymentStatus: {
   type: String,
   enum: ["Pending", "Paid", "Failed", "Completed","Allocated"],
   default: "Pending"
 },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location"
  },
  date: String,
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  slotNumber: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  extensionAmount: {
    type: Number,
    default: 0
  },
  extraCharge: {
    type: Number,
    default: 0
  },
  overtimeEmailSent: {
    type: Boolean,
    default: false
  },
 status: {
   type: String,
   enum: ["Pending", "Allocated", "Extended", "Confirmed", "Cancelled", "Completed", "Rejected", "Expired", "Overtime"],
   default: "Pending"
 },
  distance: {
    type: String,
    default: "TBD"
  },
  mapUrl: {
    type: String,
    default: ""
  },
  paymentToken: {
    type: String,
    default: ""
  },
  paymentApp: {
    type: String,
    default: ""
  }
}, { timestamps: true });

// Performance Indexes
bookingSchema.index({ userId: 1 });
bookingSchema.index({ locationId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ endTime: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);