/**
 * Socket.IO server: JWT auth, chat handlers, typing, read.
 * Conversation membership validated via chat.service; messages encrypted in service.
 */
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');
const chatHandlers = require('./chat.handler');
const logger = require('../config/logger');

let io = null;

function initializeSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('name avatar isActive');
      if (!user || !user.isActive) {
        return next(new Error('User not found'));
      }
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('User connected:', socket.userId);
    socket.join(socket.userId);

    socket.on('conversation:join', (payload) => {
      chatHandlers.handleConversationJoin(socket, payload?.conversationId);
    });

    socket.on('message:send', (data) => {
      chatHandlers.handleMessageSend(io, socket, data);
    });

    socket.on('typing:start', (payload) => {
      chatHandlers.handleTypingStart(socket, payload?.conversationId);
    });

    socket.on('typing:stop', (payload) => {
      chatHandlers.handleTypingStop(socket, payload?.conversationId);
    });

    socket.on('disconnect', () => {
      logger.info('User disconnected:', socket.userId);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

module.exports = {
  initializeSocket,
  getIO,
};
