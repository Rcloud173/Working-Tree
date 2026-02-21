const bcrypt = require('bcryptjs');
const OTP = require('../modules/auth/otp.model');
const User = require('../modules/user/user.model');
const { sendEmailOnce } = require('./emailService');
const { getRegistrationOTPTemplate, getPasswordResetOTPTemplate } = require('./emailTemplates');
const { OTP_EXPIRY_SECONDS, OTP_MAX_ATTEMPTS } = require('../config/constants');
const logger = require('../config/logger');

function generateOTPCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOTP(otpCode) {
  return bcrypt.hash(otpCode, 10);
}

async function verifyOTPCode(otpCode, hashedOTP) {
  return bcrypt.compare(otpCode, hashedOTP);
}

async function generateAndSendOTP(userId, email, type, userName) {
  if (!['registration', 'password_reset'].includes(type)) {
    return { success: false, message: 'Invalid OTP type' };
  }

  const otpCode = generateOTPCode();
  const hashedOTP = await hashOTP(otpCode);
  const expiryMinutes = Math.floor(OTP_EXPIRY_SECONDS / 60) || 10;
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

  const otpRecord = await OTP.create({
    userId,
    email: email.toLowerCase(),
    otpCode: hashedOTP,
    otpType: type,
    expiresAt,
    isVerified: false,
    verificationAttempts: 0,
  });

  const emailTemplate = type === 'registration'
    ? getRegistrationOTPTemplate(userName, otpCode, expiryMinutes)
    : getPasswordResetOTPTemplate(userName, otpCode, expiryMinutes);

  const emailResult = await sendEmailOnce(
    email,
    emailTemplate.subject,
    emailTemplate,
    `${type}_otp`,
    userId.toString(),
    5
  );

  if (!emailResult.success && !emailResult.skipped) {
    await OTP.findByIdAndDelete(otpRecord._id);
    return { success: false, message: 'Failed to send OTP email' };
  }

  if (emailResult.skipped) {
    await OTP.findByIdAndDelete(otpRecord._id);
    return { success: false, message: 'Please wait before requesting another OTP' };
  }

  logger.info(`OTP generated and sent to ${email} for ${type}`);

  return {
    success: true,
    otpId: otpRecord._id.toString(),
    expiresIn: OTP_EXPIRY_SECONDS,
    message: `OTP sent to ${email}`,
  };
}

async function verifyOTP(otpId, enteredOtp) {
  const otpRecord = await OTP.findById(otpId);
  if (!otpRecord) {
    return { success: false, message: 'OTP not found or expired' };
  }
  if (otpRecord.isVerified) {
    return { success: false, message: 'OTP already used' };
  }
  if (new Date() > otpRecord.expiresAt) {
    return { success: false, message: 'OTP expired' };
  }
  if (otpRecord.verificationAttempts >= OTP_MAX_ATTEMPTS) {
    return { success: false, message: 'Maximum verification attempts exceeded' };
  }

  const isValid = await verifyOTPCode(enteredOtp, otpRecord.otpCode);
  if (!isValid) {
    otpRecord.verificationAttempts += 1;
    await otpRecord.save();
    const attemptsRemaining = OTP_MAX_ATTEMPTS - otpRecord.verificationAttempts;
    return {
      success: false,
      message: 'Invalid OTP code',
      attemptsRemaining: Math.max(0, attemptsRemaining),
    };
  }

  otpRecord.isVerified = true;
  otpRecord.verificationAttempts += 1;
  await otpRecord.save();
  logger.info(`OTP verified for user ${otpRecord.userId}`);

  return {
    success: true,
    message: 'OTP verified successfully',
    userId: otpRecord.userId,
    email: otpRecord.email,
    type: otpRecord.otpType,
  };
}

async function resendOTP(otpId) {
  const otpRecord = await OTP.findById(otpId);
  if (!otpRecord) {
    return { success: false, message: 'OTP not found' };
  }
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  if (otpRecord.createdAt < thirtyMinutesAgo) {
    return { success: false, message: 'OTP request expired. Please request a new one.' };
  }
  if (otpRecord.isVerified) {
    return { success: false, message: 'OTP already used' };
  }

  const newOTPCode = generateOTPCode();
  otpRecord.otpCode = await hashOTP(newOTPCode);
  otpRecord.expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
  otpRecord.verificationAttempts = 0;
  await otpRecord.save();

  const user = await User.findById(otpRecord.userId);
  const userName = user?.name || 'User';
  const expiryMinutes = Math.floor(OTP_EXPIRY_SECONDS / 60) || 10;
  const emailTemplate = otpRecord.otpType === 'registration'
    ? getRegistrationOTPTemplate(userName, newOTPCode, expiryMinutes)
    : getPasswordResetOTPTemplate(userName, newOTPCode, expiryMinutes);

  const emailResult = await sendEmailOnce(
    otpRecord.email,
    emailTemplate.subject,
    emailTemplate,
    `${otpRecord.otpType}_otp_resend`,
    otpRecord.userId.toString(),
    2
  );

  if (!emailResult.success && !emailResult.skipped) {
    return { success: false, message: 'Failed to resend OTP email' };
  }
  if (emailResult.skipped) {
    return { success: false, message: 'Please wait before resending' };
  }

  logger.info(`OTP resent to ${otpRecord.email}`);
  return {
    success: true,
    message: 'OTP resent successfully',
    expiresIn: OTP_EXPIRY_SECONDS,
  };
}

async function invalidateOTP(otpId) {
  await OTP.findByIdAndDelete(otpId);
  logger.info(`OTP invalidated: ${otpId}`);
  return { success: true, message: 'OTP invalidated' };
}

module.exports = {
  generateAndSendOTP,
  verifyOTP,
  resendOTP,
  invalidateOTP,
  generateOTPCode,
  hashOTP,
  verifyOTPCode,
};
