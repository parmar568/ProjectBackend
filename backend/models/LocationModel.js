const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema({

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

  mapUrl: {
    type: String,
    default: ""
  }

});

module.exports = mongoose.model("Location", LocationSchema);