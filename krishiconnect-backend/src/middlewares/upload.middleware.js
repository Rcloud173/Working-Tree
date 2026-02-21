const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { MAX_FILE_SIZE, MAX_FILES, PROFILE_PIC_MAX_SIZE, BACKGROUND_MAX_SIZE } = require('../config/constants');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const allowedVideos = ['video/mp4', 'video/mpeg', 'video/quicktime'];
  const allowedAudio = ['audio/mpeg', 'audio/wav', 'audio/webm'];

  const allowed = [...allowedImages, ...allowedVideos, ...allowedAudio];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type'), false);
  }
};

const imageOnlyFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedImages.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Allowed: JPEG, PNG, WebP'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

const uploadProfilePic = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: PROFILE_PIC_MAX_SIZE, files: 1 },
});

const uploadBackground = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: BACKGROUND_MAX_SIZE, files: 1 },
});

const uploadSingle = (fieldName) => (req, res, next) => {
  const uploadHandler = upload.single(fieldName);

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File too large (max 20MB)'));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    next();
  });
};

const uploadMultiple = (fieldName, maxCount = MAX_FILES) => (req, res, next) => {
  const uploadHandler = upload.array(fieldName, maxCount);

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File too large (max 20MB)'));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, `Maximum ${maxCount} files allowed`));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    next();
  });
};

const uploadSingleProfilePic = (fieldName) => (req, res, next) => {
  const uploadHandler = uploadProfilePic.single(fieldName);
  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File is too large. Max size is 5MB'));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    next();
  });
};

const uploadSingleBackground = (fieldName) => (req, res, next) => {
  const uploadHandler = uploadBackground.single(fieldName);
  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File is too large. Max size is 10MB'));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) return next(err);
    next();
  });
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadSingleProfilePic,
  uploadSingleBackground,
};
