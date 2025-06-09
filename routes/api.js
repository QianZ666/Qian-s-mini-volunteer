const express = require('express');
const router = express.Router();
const Post = require('../models/post');

// GET /api/posts - 获取所有 posts 数据
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .select('title location coords description createdAt') // 只返回需要的字段
      .lean(); // 让它返回普通 JS 对象，性能更好

    res.json(posts);
  } catch (err) {
    console.error('Failed to fetch posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
