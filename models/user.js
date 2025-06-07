const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  hashedPassword: String,
  avatarUrl: String,
  privacySettings: {
    notificationsEnabled: Boolean,
    profilePublic: Boolean
  },
  posts: Array,
  savedTerms: Array,
  savedPosts: Array
});

module.exports = mongoose.model('User', userSchema);
