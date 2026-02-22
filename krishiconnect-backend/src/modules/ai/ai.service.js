const { GoogleGenerativeAI } = require('@google/generative-ai');
const ApiError = require('../../utils/ApiError');
const { getRedis } = require('../../config/redis');
const logger = require('../../config/logger');

const DAILY_LIMIT = 10;
const USAGE_TTL_SECONDS = 86400; // 24 hours

const AGRICULTURE_KEYWORDS = [
  'crop', 'crops', 'soil', 'fertilizer', 'fertilizers', 'pest', 'pests',
  'irrigation', 'mandi', 'wheat', 'rice', 'cotton', 'livestock', 'dairy',
  'weather', 'farming', 'agriculture', 'agricultural', 'farmer', 'farmers',
  'government scheme', 'scheme', 'sowing', 'harvest', 'harvesting',
  'pesticide', 'weed', 'seeds', 'cattle', 'poultry', 'organic', 'krishi',
  'kharif', 'rabi', 'zyad', 'बीज', 'खत', 'पीक', 'शेती', 'पिक',
];

const SYSTEM_PROMPT = `You are an agricultural expert assistant for Indian farmers.
You must ONLY answer agriculture-related questions.
If the question is not related to farming, respond: "I can only help with agriculture-related questions."
Never provide dangerous chemical dosage.
Always recommend consulting local agricultural authorities before applying pesticides or chemicals.
Respond in plain text only.`;

const inMemoryUsage = new Map();

function getUsageKey(userId) {
  const date = new Date().toISOString().slice(0, 10);
  return `ai_usage:${userId}:${date}`;
}

function hasAgricultureContext(question) {
  const normalized = question.trim().toLowerCase();
  return AGRICULTURE_KEYWORDS.some((kw) => normalized.includes(kw.toLowerCase()));
}

async function checkAndIncrementUsage(userId) {
  const key = getUsageKey(userId);
  const redis = getRedis();

  if (redis) {
    try {
      const count = await redis.get(key);
      const num = count ? parseInt(count, 10) : 0;
      if (num >= DAILY_LIMIT) {
        throw new ApiError(429, 'Daily AI limit reached.');
      }
      const newCount = await redis.incr(key);
      if (newCount === 1) {
        await redis.expire(key, USAGE_TTL_SECONDS);
      }
      return;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      // Redis unavailable: fallback to in-memory
    }
  }

  const current = inMemoryUsage.get(key) || 0;
  if (current >= DAILY_LIMIT) {
    throw new ApiError(429, 'Daily AI limit reached.');
  }
  inMemoryUsage.set(key, current + 1);
}

function sanitizeQuestion(input) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 1000);
}

const GEMINI_MODEL = 'gemini-pro';

async function askGemini(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    logger.warn('AI: GEMINI_API_KEY is not set or empty');
    throw new ApiError(503, 'AI service is not configured.');
  }

  const prompt = typeof question === 'string' ? question : String(question);
  if (!prompt.trim()) {
    throw new ApiError(400, 'Question is required.');
  }
  const fullPrompt = `${SYSTEM_PROMPT}\n\nUser question:\n${prompt}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    if (!response) {
      throw new ApiError(502, 'AI response unavailable.');
    }
    let text;
    try {
      text = typeof response.text === 'function' ? response.text() : '';
    } catch (innerErr) {
      logger.error('AI: failed to read response text', { stack: innerErr?.stack });
      throw new ApiError(502, 'AI response unavailable.');
    }
    if (!text || !String(text).trim()) {
      throw new ApiError(502, 'AI response unavailable.');
    }
    return String(text).trim();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    logger.error('Gemini API error', {
      message: err.message,
      stack: err.stack,
      status: err.status,
      statusText: err.statusText,
    });
    if (err.status === 429) {
      throw new ApiError(429, 'AI rate limit exceeded. Please try again later.');
    }
    throw new ApiError(502, 'AI service is temporarily unavailable. Please try again later.');
  }
}

async function ask(userId, rawQuestion) {
  const question = sanitizeQuestion(rawQuestion);
  if (!question || question.length < 10) {
    throw new ApiError(400, 'Validation failed');
  }

  if (!hasAgricultureContext(question)) {
    throw new ApiError(400, 'I can only help with agriculture-related questions.');
  }

  await checkAndIncrementUsage(userId);

  const answer = await askGemini(question);
  return { answer };
}

module.exports = {
  ask,
};
