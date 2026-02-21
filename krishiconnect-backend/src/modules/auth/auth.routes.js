const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const {
  validate,
  registerSchema,
  verifyOTPSchema,
  verifyRegistrationOTPSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordEmailSchema,
  resetPasswordWithOTPSchema,
  resendOTPSchema,
} = require('./auth.validation');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authLimiter, registerLimiter, forgotPasswordLimiter } = require('../../middlewares/rateLimit.middleware');

router.use(authLimiter);

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/verify-otp', validate(verifyOTPSchema), authController.verifyOTP);
router.post('/verify-registration-otp', validate(verifyRegistrationOTPSchema), authController.verifyRegistrationOTP);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordEmailSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordWithOTPSchema), authController.resetPasswordWithOTP);
router.post('/resend-otp', validate(resendOTPSchema), authController.resendOTP);

module.exports = router;
