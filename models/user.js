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
  posts: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Post'
}],
  savedTerms: Array,
  savedPosts: Array
});

module.exports = mongoose.model('User', userSchema);
