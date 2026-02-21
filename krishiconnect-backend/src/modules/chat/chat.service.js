const Conversation = require('./models/conversation.model');
const Message = require('./models/message.model');
const Follow = require('../user/follow.model');
const ApiError = require('../../utils/ApiError');
const Pagination = require('../../utils/pagination');
const { encrypt, decrypt } = require('../../utils/encryption');

const conversationPagination = new Pagination(Conversation);
const messagePagination = new Pagination(Message);

const PREVIEW_MAX_LENGTH = 80;

/**
 * User A can chat with User B iff A follows B OR B follows A (at least one direction).
 */
async function canChatWith(currentUserId, otherUserId) {
  if (String(currentUserId) === String(otherUserId)) {
    return false;
  }
  const [aFollowsB, bFollowsA] = await Promise.all([
    Follow.findOne({ follower: currentUserId, following: otherUserId }),
    Follow.findOne({ follower: otherUserId, following: currentUserId }),
  ]);
  return !!(aFollowsB || bFollowsA);
}

/**
 * Start or get existing direct conversation. Enforces canChatWith.
 */
async function startConversation(userId, otherUserId) {
  const allowed = await canChatWith(userId, otherUserId);
  if (!allowed) {
    throw new ApiError(403, 'You can only start a chat with users you follow or who follow you');
  }
  const allParticipants = [userId, otherUserId].map((id) => id.toString()).sort();
  let conversation = await Conversation.findOne({
    type: 'direct',
    $and: [
      { 'participants.user': allParticipants[0] },
      { 'participants.user': allParticipants[1] },
    ],
  });
  if (conversation) {
    return conversation.populate('participants.user', 'name avatar profilePhoto');
  }
  conversation = await Conversation.create({
    type: 'direct',
    participants: allParticipants.map((id) => ({ user: id })),
  });
  return conversation.populate('participants.user', 'name avatar profilePhoto');
}

const createConversation = async (userId, participants, type = 'direct') => {
  const allParticipants = [userId, ...participants].filter(
    (p, i, arr) => arr.indexOf(p) === i
  );

  if (type === 'direct' && allParticipants.length !== 2) {
    throw new ApiError(400, 'Direct conversation requires exactly 2 participants');
  }

  if (type === 'direct') {
    const allowed = await canChatWith(allParticipants[0], allParticipants[1]);
    if (!allowed) {
      throw new ApiError(403, 'You can only chat with users you follow or who follow you');
    }
  }

  let existing = null;
  if (type === 'direct' && allParticipants.length === 2) {
    const sorted = allParticipants.map((id) => id.toString()).sort();
    existing = await Conversation.findOne({
      type: 'direct',
      $and: [
        { 'participants.user': sorted[0] },
        { 'participants.user': sorted[1] },
      ],
    });
  }

  if (existing) {
    return existing.populate('participants.user', 'name avatar profilePhoto');
  }

  const conversation = await Conversation.create({
    type,
    participants: allParticipants.map((id) => ({ user: id })),
  });

  return conversation.populate('participants.user', 'name avatar profilePhoto');
};

const getConversations = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;

  const result = await conversationPagination.paginate(
    { 'participants.user': userId, isActive: true },
    {
      page,
      limit,
      sort: { updatedAt: -1 },
      populate: [
        { path: 'participants.user', select: 'name avatar profilePhoto' },
        { path: 'lastMessage.sender', select: 'name' },
      ],
    }
  );

  const data = result.data.map((conv) => {
    const doc = conv.toObject ? conv.toObject() : conv;
    if (doc.lastMessage && doc.lastMessage.encryptedText && doc.lastMessage.iv) {
      try {
        let text = decrypt(doc.lastMessage.encryptedText, doc.lastMessage.iv, true);
        if (typeof text === 'object' && text != null) text = text.text ?? JSON.stringify(text);
        doc.lastMessage.text = String(text || '').slice(0, PREVIEW_MAX_LENGTH);
      } catch {
        doc.lastMessage.text = '[Message]';
      }
      delete doc.lastMessage.encryptedText;
      delete doc.lastMessage.iv;
    }
    return doc;
  });

  return { data, pagination: result.pagination };
};

const getMessages = async (conversationId, userId, options = {}) => {
  const { page = 1, limit = 50, before } = options;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    'participants.user': userId,
  });

  if (!conversation) {
    throw new ApiError(403, 'Conversation not found or access denied');
  }

  let query = { conversation: conversationId, isDeleted: false };

  if (before) {
    const beforeMsg = await Message.findById(before);
    if (beforeMsg) {
      query.createdAt = { $lt: beforeMsg.createdAt };
    }
  }

  const result = await messagePagination.paginate(query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [{ path: 'sender', select: 'name avatar profilePhoto' }],
  });

  const data = result.data.map((msg) => {
    const doc = msg.toObject ? msg.toObject() : msg;
    try {
      doc.content = decrypt(doc.encryptedContent, doc.iv, true);
    } catch {
      doc.content = { text: '[Unable to decrypt]' };
    }
    delete doc.encryptedContent;
    delete doc.iv;
    return doc;
  });

  return { data, pagination: result.pagination };
};

/**
 * Create message with encrypted content. Used by socket and (if needed) REST.
 * Returns message doc with decrypted content for emitting.
 */
const createMessage = async (conversationId, senderId, type, content) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    'participants.user': senderId,
  });

  if (!conversation) {
    throw new ApiError(403, 'Conversation not found or access denied');
  }

  const contentPayload = type === 'text' ? { text: content?.text || content || '' } : content || {};
  const { encrypted, iv } = encrypt(contentPayload);

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    type: type || 'text',
    encryptedContent: encrypted,
    iv,
    status: 'sent',
  });

  const previewText = type === 'text' ? String(contentPayload.text || '').slice(0, PREVIEW_MAX_LENGTH) : `[${type}]`;
  const { encrypted: encryptedPreview, iv: previewIv } = encrypt(JSON.stringify(previewText));

  conversation.lastMessage = {
    encryptedText: encryptedPreview,
    iv: previewIv,
    sender: senderId,
    sentAt: new Date(),
  };
  await conversation.save();

  const populated = await message.populate('sender', 'name avatar profilePhoto');
  const out = populated.toObject ? populated.toObject() : populated;
  out.content = contentPayload;
  delete out.encryptedContent;
  delete out.iv;
  return out;
};

/**
 * Verify that userId is a participant of conversationId. Used by socket.
 */
async function isParticipant(conversationId, userId) {
  const conv = await Conversation.findOne(
    { _id: conversationId, 'participants.user': userId },
    { _id: 1 }
  );
  return !!conv;
}

module.exports = {
  canChatWith,
  startConversation,
  createConversation,
  getConversations,
  getMessages,
  createMessage,
  isParticipant,
};
