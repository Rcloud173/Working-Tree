const Conversation = require('./models/conversation.model');
const Message = require('./models/message.model');
const ApiError = require('../../utils/ApiError');
const Pagination = require('../../utils/pagination');

const conversationPagination = new Pagination(Conversation);
const messagePagination = new Pagination(Message);

const createConversation = async (userId, participants, type = 'direct') => {
  const allParticipants = [userId, ...participants].filter(
    (p, i, arr) => arr.indexOf(p) === i
  );

  if (type === 'direct' && allParticipants.length !== 2) {
    throw new ApiError(400, 'Direct conversation requires exactly 2 participants');
  }

  let existing = null;
  if (type === 'direct' && allParticipants.length === 2) {
    existing = await Conversation.findOne({
      type: 'direct',
      $and: [
        { 'participants.user': allParticipants[0] },
        { 'participants.user': allParticipants[1] },
      ],
    });
  }

  if (existing) {
    return existing.populate('participants.user', 'name avatar');
  }

  const conversation = await Conversation.create({
    type,
    participants: allParticipants.map((id) => ({ user: id })),
  });

  return conversation.populate('participants.user', 'name avatar');
};

const getConversations = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;

  return conversationPagination.paginate(
    { 'participants.user': userId, isActive: true },
    {
      page,
      limit,
      sort: { updatedAt: -1 },
      populate: [
        { path: 'participants.user', select: 'name avatar' },
        { path: 'lastMessage.sender', select: 'name' },
      ],
    }
  );
};

const getMessages = async (conversationId, userId, options = {}) => {
  const { page = 1, limit = 50, before } = options;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    'participants.user': userId,
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  let query = { conversation: conversationId, isDeleted: false };

  if (before) {
    const beforeMsg = await Message.findById(before);
    if (beforeMsg) {
      query.createdAt = { $lt: beforeMsg.createdAt };
    }
  }

  return messagePagination.paginate(query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [{ path: 'sender', select: 'name avatar' }],
  });
};

const createMessage = async (conversationId, senderId, type, content) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    'participants.user': senderId,
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    type,
    content,
  });

  conversation.lastMessage = {
    text: type === 'text' ? content.text : `${type} message`,
    sender: senderId,
    sentAt: new Date(),
  };
  await conversation.save();

  return message.populate('sender', 'name avatar');
};

module.exports = {
  createConversation,
  getConversations,
  getMessages,
  createMessage,
};
