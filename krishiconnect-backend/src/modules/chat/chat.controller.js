const chatService = require('./chat.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createConversation = asyncHandler(async (req, res) => {
  const { type = 'direct', participants } = req.body;
  const conversation = await chatService.createConversation(
    req.user._id,
    participants,
    type
  );
  res.status(201).json(
    new ApiResponse(201, conversation, 'Conversation created successfully')
  );
});

const getConversations = asyncHandler(async (req, res) => {
  const result = await chatService.getConversations(req.user._id, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Conversations fetched successfully', {
      pagination: result.pagination,
    })
  );
});

const getMessages = asyncHandler(async (req, res) => {
  const result = await chatService.getMessages(
    req.params.conversationId,
    req.user._id,
    req.query
  );
  res.status(200).json(
    new ApiResponse(200, result.data, 'Messages fetched successfully', {
      pagination: result.pagination,
    })
  );
});

module.exports = {
  createConversation,
  getConversations,
  getMessages,
};
