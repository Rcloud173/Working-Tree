const userService = require('./user.service');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

const uploadAvatar = asyncHandler(async (req, res) => {
  const avatarData = req.uploadResult;
  const user = await userService.updateAvatar(req.user._id, avatarData);
  res.status(200).json(new ApiResponse(200, user, 'Profile picture updated successfully'));
});

const removeAvatar = asyncHandler(async (req, res) => {
  const user = await userService.removeAvatar(req.user._id);
  res.status(200).json(new ApiResponse(200, user, 'Profile picture removed'));
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const photoData = req.uploadResult;
  const user = await userService.updateProfilePhoto(req.user._id, photoData);
  res.status(200).json(new ApiResponse(200, user, 'Profile photo updated successfully'));
});

const updateBio = asyncHandler(async (req, res) => {
  const { bio } = req.body;
  const user = await userService.updateBio(req.user._id, bio);
  res.status(200).json(new ApiResponse(200, user, 'Bio updated successfully'));
});

const clearBio = asyncHandler(async (req, res) => {
  const user = await userService.clearBio(req.user._id);
  res.status(200).json(new ApiResponse(200, user, 'Bio cleared'));
});

const updateBackground = asyncHandler(async (req, res) => {
  const preset = req.body?.preset;
  const backgroundData = req.uploadResult;
  if (!preset && !backgroundData) {
    throw new ApiError(400, 'Either preset or background image is required');
  }
  const user = await userService.updateBackground(req.user._id, { preset, backgroundData });
  res.status(200).json(new ApiResponse(200, user, backgroundData ? 'Background updated successfully' : 'Background preset applied'));
});

const getBackgroundPresets = asyncHandler(async (req, res) => {
  const result = userService.getBackgroundPresets();
  res.status(200).json(new ApiResponse(200, { presets: result.presets }, 'Background presets fetched'));
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.params.userId, req.user?._id);
  res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
});

const searchUsers = asyncHandler(async (req, res) => {
  const result = await userService.searchUsers(req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Users fetched successfully', {
      pagination: result.pagination,
    })
  );
});

const followUser = asyncHandler(async (req, res) => {
  await userService.followUser(req.user._id, req.params.userId);
  res.status(200).json(new ApiResponse(200, { success: true }, 'User followed successfully'));
});

const unfollowUser = asyncHandler(async (req, res) => {
  await userService.unfollowUser(req.user._id, req.params.userId);
  res.status(200).json(new ApiResponse(200, { success: true }, 'User unfollowed successfully'));
});

const getFollowers = asyncHandler(async (req, res) => {
  const result = await userService.getFollowers(req.params.userId, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Followers fetched successfully', {
      pagination: result.pagination,
    })
  );
});

const getFollowing = asyncHandler(async (req, res) => {
  const result = await userService.getFollowing(req.params.userId, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Following fetched successfully', {
      pagination: result.pagination,
    })
  );
});

module.exports = {
  getMe,
  updateMe,
  uploadAvatar,
  removeAvatar,
  uploadProfilePhoto,
  updateBio,
  clearBio,
  updateBackground,
  getBackgroundPresets,
  getUserById,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
