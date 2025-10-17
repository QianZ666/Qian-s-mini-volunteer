// routes/api/geocode.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const GEOCODE_API_KEY = process.env.GEOCODING_API_KEY;

router.get("/reverse-geocode", async (req, res) => {
  const { lat, lng } = req.query;

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        latlng: `${lat},${lng}`,
        key: GEOCODE_API_KEY,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Reverse geocoding error:", error.message);
    res.status(500).json({ error: "Reverse geocoding failed" });
  }
});

module.exports = router;
