const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { uploadSingleProfilePic, uploadSingleBackground } = require('../../middlewares/upload.middleware');
const { uploadToCloudinary } = require('../../utils/uploadToCloudinary');
const ApiError = require('../../utils/ApiError');

// Public route: background presets (no auth required)
router.get('/profile/backgrounds', userController.getBackgroundPresets);

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);

router.post(
  '/me/avatar',
  uploadSingleProfilePic('avatar'),
  async (req, res, next) => {
    if (req.file) {
      try {
        req.uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'krishiconnect/avatars',
        });
      } catch (err) {
        return next(err);
      }
    } else {
      return next(new ApiError(400, 'No file uploaded'));
    }
    next();
  },
  userController.uploadAvatar
);
router.delete('/me/avatar', userController.removeAvatar);

router.post(
  '/profile-photo',
  uploadSingleProfilePic('profilePhoto'),
  async (req, res, next) => {
    if (!req.file) {
      if (process.env.NODE_ENV !== 'test') {
        console.log('[profile-photo] No file in request. req.file:', req.file, 'req.body:', Object.keys(req.body || {}));
      }
      return next(new ApiError(400, 'No file uploaded'));
    }
    try {
      req.uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'krishiconnect/profile-photos',
      });
    } catch (err) {
      return next(err);
    }
    next();
  },
  userController.uploadProfilePhoto
);

router.put('/me/bio', userController.updateBio);
router.delete('/me/bio', userController.clearBio);

router.post(
  '/me/background',
  (req, res, next) => {
    if (req.is('multipart/form-data')) {
      return uploadSingleBackground('background')(req, res, (err) => {
        if (err) return next(err);
        if (req.file) {
          uploadToCloudinary(req.file.buffer, { folder: 'krishiconnect/backgrounds' })
            .then((result) => {
              req.uploadResult = result;
              next();
            })
            .catch(next);
        } else {
          next();
        }
      });
    }
    next();
  },
  userController.updateBackground
);

router.get('/search', userController.searchUsers);
router.get('/:userId', userController.getUserById);
router.post('/:userId/follow', userController.followUser);
router.delete('/:userId/follow', userController.unfollowUser);
router.get('/:userId/followers', userController.getFollowers);
router.get('/:userId/following', userController.getFollowing);

module.exports = router;
