const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware').authenticate;
const { aiLimiter } = require('../../middlewares/rateLimit.middleware');
const { askSchema, validate } = require('./ai.validation');
const aiController = require('./ai.controller');

router.post('/ask', authenticate, aiLimiter, validate(askSchema), aiController.ask);

module.exports = router;
