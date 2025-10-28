const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const Post = require('../models/post');

//  multer：to public/uploads
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

// middleware
function isLoggedIn(req, res, next) {
  if (req.session && req.session.userId) {
    req.user = { _id: req.session.userId };
    return next();
  }
  return res.status(401).send('Not logged in');
}

// get post
router.get('/createPost', (req, res) => {
  res.render('createPost', {
    GEOCODING_API_KEY: process.env.GEOCODING_API_KEY
  });
});

// create post 
router.post('/createPost', upload.single('photo'), async (req, res) => {
  try {
    const { title, location, date, time, urgency, contact, description } = req.body;

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
      // photoPath: req.file ? `/uploads/${req.file.filename}` : null,
      photoPath: req.file ? `${req.file.filename}` : null,
      user: req.user._id,
      comments: [] 
    });

    await newPost.save();
    res.redirect('main');
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).send('Failed to create post. Please check address format.');
  }
});

// the detailed post
router.get('/post/:id', async (req, res) => {
  // try {
    const post = await Post.findById(req.params.id).populate("user");
    // console.log("DEBUG: /post/:id got", req.params.id);
    let isOwner = false;
    if(req.session.userId && post.user._id.toString() === req.session.userId){
       isOwner = true;
    }

    res.render('postDetail', { post,isOwner });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server error');
//   }
});

// add commmet
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

// geocode address
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
//accept task
router.post("/acceptTask/:postId", async(req,res) => {
  try {
    if(!req.session.userId){
      return res.status(401).json({error:"Please log in"});
    }

    const postId = req.params.postId;
    const userId = req.session.userId;
    const {name, phone} = req.body;

    const post = await Post.findById(postId);

    if(!post){
      return res.status(404).json({error:"Task not exist"})
    }

    const alreadyAccepted = post.volunteers.some(
      (v) => v.userID.toString() === userId.toString()
    );

     if (alreadyAccepted) {
      return res.status(400).json({ error: "You have already accepted this task" });
    }

    const taskAlreadyTaken = post.volunteers.some(
      (v) => v.status === "holding"
    );
    if (taskAlreadyTaken) {
      return res.status(400).json({ error: "Task has already been accepted by another volunteer" });
    }

    const newVolunteer = {
      userID: userId,
      name,
      phone,
      status: "holding",
    };
    post.volunteers.push(newVolunteer);

    await post.save();

    res.json({ message: "Task has been accepted", volunteer: newVolunteer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
