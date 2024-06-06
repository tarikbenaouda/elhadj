const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post must have a title.'],
  },
  postalCode: {
    type: Number,
    required: [true, 'Post must have a postal code.'],
  },
  commune: {
    type: String,
    required: [true, 'Post must belong to a commune.'],
  },
  wilaya: {
    type: String,
    required: [true, 'Post must belong to a wilaya.'],
  },
  postman: {
    type: [mongoose.Schema.ObjectId],
    ref: 'Postman',
    required: [true, 'Postman is required.'],
  },
  position: {
    type: {
      lat: Number,
      lng: Number,
    },
  },
  description: {
    type: String,
  },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
