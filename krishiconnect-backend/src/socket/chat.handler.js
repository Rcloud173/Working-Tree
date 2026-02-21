/**
 * Socket handlers for chat: conversation join, message send, typing, read.
 * Business logic lives in chat.service; this layer validates and emits.
 */
const chatService = require('../modules/chat/chat.service');
const { messageRateLimit } = require('./rateLimit');
const logger = require('../config/logger');

async function handleConversationJoin(socket, conversationId) {
  if (!conversationId) {
    socket.emit('error', { message: 'conversationId required' });
    return;
  }
  const isMember = await chatService.isParticipant(conversationId, socket.userId);
  if (!isMember) {
    socket.emit('error', { message: 'Conversation not found or access denied' });
    return;
  }
  socket.join(conversationId);
  socket.emit('conversation:joined', { conversationId });
}

async function handleMessageSend(io, socket, data) {
  const { conversationId, type, content } = data || {};
  if (!conversationId) {
    socket.emit('error', { message: 'conversationId required' });
    return;
  }
  if (!messageRateLimit.check(socket.userId)) {
    socket.emit('error', { message: 'Too many messages. Please slow down.' });
    return;
  }
  const isMember = await chatService.isParticipant(conversationId, socket.userId);
  if (!isMember) {
    socket.emit('error', { message: 'Conversation not found or access denied' });
    return;
  }
  try {
    const message = await chatService.createMessage(
      conversationId,
      socket.userId,
      type || 'text',
      type === 'text' ? (content?.text ?? content) : content
    );
    io.to(conversationId).emit('message:new', message);
  } catch (err) {
    logger.error('[socket] message:send', err);
    socket.emit('error', { message: err.message || 'Failed to send message' });
  }
}

function handleTypingStart(socket, conversationId) {
  if (conversationId) {
    socket.to(conversationId).emit('user:typing', {
      userId: socket.userId,
      conversationId,
    });
  }
}

function handleTypingStop(socket, conversationId) {
  if (conversationId) {
    socket.to(conversationId).emit('user:stopped-typing', {
      userId: socket.userId,
      conversationId,
    });
  }
}

module.exports = {
  handleConversationJoin,
  handleMessageSend,
  handleTypingStart,
  handleTypingStop,
};
