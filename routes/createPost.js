const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const Post = require('../models/post');
const User = require('../models/user');


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
  res.render('createPost', {
    GEOCODING_API_KEY: process.env.GEOCODING_API_KEY
  });
});


//GET/post/:id
router.get('/post/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
  

    if (!post) {
      return res.status(404).send('Post not found');
    }
    let isOwner = false;

    if (
      req.user &&
      req.user._id &&
      post.user && (
        typeof post.user === 'object' || typeof post.user === 'string'
      )
    ) {
      const postUserId = typeof post.user === 'object' && post.user.toString
        ? post.user.toString()
        : post.user;

      const currentUserId = typeof req.user._id === 'object' && req.user._id.toString
        ? req.user._id.toString()
        : req.user._id;

         isOwner = postUserId === currentUserId;
    }

    res.render('postDetail', { post, user: req.user,isOwner });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.post('/createPost', upload.single('photo'), async (req, res) => {
  try {
    const { title, date,location, time, urgency, contact, description } = req.body;

    console.log("📍 address before geocoding:", location);
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
        photoPath:  req.file ?  req.file.filename : null,

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
  const apiKey = process.env.GEOCODING_API_KEY;
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

// 接受任务：保存志愿者信息
router.post('/acceptTask/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { name, phone } = req.body;

    if (!req.user){
      return res.status(401).send('Not logged in');
    }

    const post = await Post.findById(postId);
    if (!post || post.volunteer) {
      return res.status(400).send('Task not available');
    }
    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.volunteer) {
      return res.status(400).send('Task already accepted');
    }

    post.volunteer = {
      name,
      phone,
      userId: req.user._id,
      status: 'holding'
    };

    await post.save();
    res.redirect('/post/' + postId);
  } catch (error) {
    console.error('Accept task error:', error);
    res.status(500).send('Server error');
  }
});

// 完成任务：更新状态并加分
router.post('/completeTask/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post || !post.volunteer) {
      return res.status(400).send('Invalid task');
    }

    if (post.volunteer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).send('You are not the assigned volunteer');
    }

    post.volunteer.status = 'completed';

    // 给志愿者加分（注意你可能需要在 User 模型中添加积分字段）
    const user = await require('../models/user').findById(req.user._id);
    user.points = (user.points || 0) + 1;
    await user.save();

    await post.save();
    res.redirect('/post/' + postId);
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
