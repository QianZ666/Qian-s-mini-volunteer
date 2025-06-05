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
      title,
      location,
      coords,
      date,
      time,
      urgency,
      contact,
      description,
      photoPath: req.file ? `/uploads/${req.file.filename}` : null
    });

    await newPost.save();
    res.redirect('/main');
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).send('Failed to create post. Please check address format.');
  }
});

async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'ShareTimeApp/1.0' }
  });
  if (response.data.length === 0) {
    throw new Error('Address not found');
  }
  const { lat, lon } = response.data[0];
  return { lat: parseFloat(lat), lng: parseFloat(lon) };
}

module.exports = router;
