const mongoose = require("mongoose");

const ParkingLocationSchema = new mongoose.Schema({

  city: {
    type: String,
    required: true
  },

  area: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  totalSlots: {
    type: Number,
    required: true,
    default: 10
  },

  availableSlots: {
    type: Number,
    required: true,
    default: 10
  },

  mapUrl: {
    type: String,
    default: ""
  }

});

// Performance Indexes
ParkingLocationSchema.index({ city: 1, area: 1 });

module.exports = mongoose.model("Location", ParkingLocationSchema);