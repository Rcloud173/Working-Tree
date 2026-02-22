const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const aiService = require('./ai.service');

const ask = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }
  const userId = (user._id || user.id).toString();
  const question = req.body?.question;
  if (question == null || typeof question !== 'string') {
    throw new ApiError(400, 'Question is required.');
  }
  const data = await aiService.ask(userId, question);
  console.log(data);
  res.status(200).json(new ApiResponse(200, data, 'OK'));
});

module.exports = {
  ask,
};
