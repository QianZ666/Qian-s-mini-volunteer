const express = require('express');
const router = express.Router();

router.get('/createPost', async (req, res) => {
  res.render('createPost' );
});

module.exports = router;