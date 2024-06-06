const Post = require('../models/postModel');
const catchAsync = require('../utils/catchAsync');

exports.getPositions = catchAsync(async (req, res, next) => {
  const posts = (await Post.find())
    .filter((post) => post.commune === req.user.commune)
    .map((post, i) => {
      const { title: name, position, description } = post;
      return { id: i, name, position, description };
    });
  res.status(200).json({
    status: 'success',
    results: posts.length,
    data: posts,
  });
});
