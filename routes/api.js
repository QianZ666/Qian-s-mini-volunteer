const express = require('express');
const router = express.Router();
const Post = require('../models/post');

// GET /api/posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .select('title location coords description createdAt') 
      .lean(); 

    res.json(posts);
  } catch (err) {
    console.error('Failed to fetch posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
