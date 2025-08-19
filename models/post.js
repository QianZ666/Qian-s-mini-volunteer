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
  createdAt: { type: Date, default: Date.now },
  user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User', 
  required: true
},
  volunteer:{
    userID:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User'
    },
    name:String,
    phone:String,
    status:{
      type:String,
      enum:['open', 'holding', 'completed'],
      default:'open'
    }
  },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      date: { type: Date, default: Date.now },
      // replies: [
      //   {
      //     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      //     text: String,
      //     date: { type: Date, default: Date.now }
      //   }
      // ]
    }
  ]
});

module.exports = mongoose.model('Post', postSchema);
