const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const Post = require('../models/post');

// 配置 multer：图片上传到 public/uploads 文件夹
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
router.get('/createPost', async (req, res) => {
  res.render('createPost');
});

router.post('/createPost', upload.single('photo'), async (req, res) => {
  try {
    const { title, date,location, time, urgency, contact, description } = req.body;

    // 调用 geocode 获取经纬度
    const coords = await geocodeAddress(location);

    const newPost = new Post({
        title: req.body.title,
        location: req.body.location,
        coords: req.body.coords,
        date: req.body.date,
        time: req.body.time,
        urgency: req.body.urgency,
        contact: req.body.contact,
        description: req.body.description,
        photoPath: req.body.photoPath,

        user: req.user._id 
    });

    await newPost.save();
    res.redirect('/');
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).send('Failed to create post. Please check address format.');
  }
});

async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  console.log('Geocoding URL');
  const response = await axios.get(url);
  console.log('Geocoding response:', response.data);
  if (response.data.status !== 'OK' || response.data.results.length === 0) {
    throw new Error('Address not found');
  }
  const location = response.data.results[0].geometry.location;
  return { lat: location.lat, lng: location.lng };
}

module.exports = router;
