const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const { validate, createConversationSchema } = require('./chat.validation');
const { authenticate } = require('../../middlewares/auth.middleware');

router.use(authenticate);

router.post('/conversations', validate(createConversationSchema), chatController.createConversation);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId/messages', chatController.getMessages);

module.exports = router;
