const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: String,
  location: String,
  coords: {
    lat: Number,
    lng: Number
  },
  date: Date,
  time: String,
  urgency: String,
  contact: String,
  description: String,
  photoPath: String,
  user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User', 
  required: true
},
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
