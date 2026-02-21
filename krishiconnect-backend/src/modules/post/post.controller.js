const postService = require('./post.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createPost = asyncHandler(async (req, res) => {
  const files = req.files && req.files.length ? req.files : [];
  const body = req.body || {};
  if (typeof body.tags === 'string') {
    try {
      body.tags = JSON.parse(body.tags);
    } catch {
      body.tags = [];
    }
  }
  const { post, postsCount } = await postService.createPost(req.user._id, body, files);
  res.status(201).json(new ApiResponse(201, { post, postsCount }, 'Post created successfully'));
});

const deletePost = asyncHandler(async (req, res) => {
  const { postsCount } = await postService.deletePost(req.params.postId, req.user._id);
  res.status(200).json(new ApiResponse(200, { postsCount }, 'Post deleted successfully'));
});

const getRecent = asyncHandler(async (req, res) => {
  const result = await postService.getRecent(req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Recent posts', { pagination: result.pagination })
  );
});

const getTrending = asyncHandler(async (req, res) => {
  const result = await postService.getTrending(req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Trending posts', { pagination: result.pagination })
  );
});

const getPostById = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(req.params.postId, req.user?._id);
  res.status(200).json(new ApiResponse(200, post, 'Post fetched'));
});

const toggleLike = asyncHandler(async (req, res) => {
  const result = await postService.toggleLike(req.params.postId, req.user._id);
  res.status(200).json(new ApiResponse(200, result, result.liked ? 'Post liked' : 'Post unliked'));
});

const addComment = asyncHandler(async (req, res) => {
  const comment = await postService.addComment(req.params.postId, req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, comment, 'Comment added'));
});

const getComments = asyncHandler(async (req, res) => {
  const result = await postService.getComments(req.params.postId, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Comments', { pagination: result.pagination })
  );
});

const toggleSave = asyncHandler(async (req, res) => {
  const result = await postService.toggleSave(req.params.postId, req.user._id);
  res.status(200).json(
    new ApiResponse(200, result, result.saved ? 'Post saved' : 'Post unsaved')
  );
});

const getSavedPosts = asyncHandler(async (req, res) => {
  const result = await postService.getSavedPosts(req.user._id, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Saved posts', { pagination: result.pagination })
  );
});

const getUserPosts = asyncHandler(async (req, res) => {
  const result = await postService.getUserPosts(req.params.userId, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'User posts', { pagination: result.pagination })
  );
});

module.exports = {
  createPost,
  deletePost,
  getRecent,
  getTrending,
  getPostById,
  toggleLike,
  addComment,
  getComments,
  toggleSave,
  getSavedPosts,
  getUserPosts,
};
