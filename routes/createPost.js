const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const Post = require('../models/post');

// 配置 multer：上传到 public/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// 登录中间件
function isLoggedIn(req, res, next) {
  if (req.session && req.session.userId) {
    req.user = { _id: req.session.userId };
    return next();
  }
  return res.status(401).send('Not logged in');
}

// 发帖页面
router.get('/createPost', (req, res) => {
  res.render('createPost', {
    GEOCODING_API_KEY: process.env.GEOCODING_API_KEY
  });
});

// 创建帖子
router.post('/createPost', upload.single('photo'), async (req, res) => {
  try {
    const { title, location, date, time, urgency, contact, description } = req.body;

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
      photoPath: req.file ? req.file.filename : null,
      user: req.user._id,
      comments: []  // 初始化评论数组
    });

    await newPost.save();
    res.redirect('/');
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).send('Failed to create post. Please check address format.');
  }
});

// 帖子详情页
router.get('/post/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).send('Post not found');

    const isOwner = req.user && post.user.toString() === req.user._id.toString();
    res.render('postDetail', { post, user: req.user, isOwner });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// 添加评论
router.post('/post/:id/comment', isLoggedIn, async (req, res) => {
  console.log('Hit comment route',req.params.id, req.body);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    const { text } = req.body;
    if (!text || !text.trim()) return res.redirect(`/post/${req.params.id}`);

    post.comments.push({
      user: req.user._id,
      text: text.trim(),
      date: new Date()
    });

    await post.save();
    res.redirect(`/post/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// geocode 地址
async function geocodeAddress(address) {
  const apiKey = process.env.GEOCODING_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await axios.get(url);
  if (response.data.status !== 'OK' || response.data.results.length === 0) {
    throw new Error('Address not found');
  }
  const location = response.data.results[0].geometry.location;
  return { lat: location.lat, lng: location.lng };
}

module.exports = router;
