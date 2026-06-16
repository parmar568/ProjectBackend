const express = require("express");
const router = express.Router();

const Location = require("../models/ParkingLocation");


// ADD LOCATION
router.post("/add", async (req, res) => {

  try {

    const location = new Location({
      city: req.body.city,
      area: req.body.area,
      price: req.body.price,
      totalSlots: req.body.totalSlots,
      availableSlots: req.body.totalSlots, // Initially both are same
      mapUrl: req.body.mapUrl
    });

    await location.save();

    res.status(201).json({
      message: "Location Added Successfully"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error adding location"
    });

  }

});


// GET LOCATIONS
router.get("/get", async (req, res) => {

  try {

    const locations = await Location.find().lean();

    res.json(locations);

  } catch (error) {

    res.status(500).json(error);

  }

});


// UPDATE LOCATION
router.put("/update/:id", async (req, res) => {

  try {

    const totalSlots = parseInt(req.body.totalSlots);
    let availableSlots = parseInt(req.body.availableSlots);

    // Ensure available slots don't exceed total slots
    if (availableSlots > totalSlots) {
      availableSlots = totalSlots;
    }

    await Location.findByIdAndUpdate(
      req.params.id,
      {
        city: req.body.city,
        area: req.body.area,
        price: req.body.price,
        totalSlots: totalSlots,
        availableSlots: availableSlots,
        mapUrl: req.body.mapUrl
      }
    );

    res.json({
      message: "Location Updated"
    });

  } catch (error) {

    res.status(500).json(error);

  }

});


// DELETE LOCATION
router.delete("/delete/:id", async (req, res) => {

  try {

    await Location.findByIdAndDelete(req.params.id);

    res.json({
      message: "Location Deleted"
    });

  } catch (error) {

    res.status(500).json(error);

  }

});


// GET CITIES
router.get("/cities", async (req, res) => {

  try {

    const cities = await Location.distinct("city");

    res.json(cities);

  } catch (error) {

    res.status(500).json(error);

  }

});


// GET AREAS
router.get("/areas/:city", async (req, res) => {

  try {

    const areas = await Location.find({
      city: req.params.city
    });

    res.json(areas);

  } catch (error) {

    res.status(500).json(error);

  }

});


module.exports = router;