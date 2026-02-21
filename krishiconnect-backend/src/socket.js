const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./modules/user/user.model');
const Message = require('./modules/chat/models/message.model');
const Conversation = require('./modules/chat/models/conversation.model');
const { getRedis } = require('./config/redis');
const logger = require('./config/logger');

let io = null;

const initializeSocket = (server) => {
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
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('User connected:', socket.userId);

    socket.join(socket.userId);

    socket.on('conversation:join', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          'participants.user': socket.userId,
        });

        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        socket.join(conversationId);
        socket.emit('conversation:joined', { conversationId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('message:send', async (data) => {
      try {
        const { conversationId, type, content } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          'participants.user': socket.userId,
        });

        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          type: type || 'text',
          content: content || {},
          status: 'sent',
        });

        await message.populate('sender', 'name avatar');

        conversation.lastMessage = {
          text: type === 'text' ? content?.text : `${type} message`,
          sender: socket.userId,
          sentAt: new Date(),
        };
        await conversation.save();

        io.to(conversationId).emit('message:new', message);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('typing:start', ({ conversationId }) => {
      socket.to(conversationId).emit('user:typing', {
        userId: socket.userId,
        conversationId,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('user:stopped-typing', {
        userId: socket.userId,
        conversationId,
      });
    });

    socket.on('disconnect', () => {
      logger.info('User disconnected:', socket.userId);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
