const Groq = require('groq-sdk');
const ApiError = require('../../utils/ApiError');
const { getRedis } = require('../../config/redis');
const logger = require('../../config/logger');

const DAILY_LIMIT = 10;
const USAGE_TTL_SECONDS = 86400; // 24 hours

// Default: fast + free-tier friendly. Switch to llama3-70b-8192 or mixtral-8x7b-32768 for better quality.
const DEFAULT_MODEL = process.env.GROQ_AI_MODEL || 'llama3-8b-8192';
const ALLOWED_MODELS = ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768'];

const AGRICULTURE_KEYWORDS = [
  'crop', 'crops', 'soil', 'fertilizer', 'fertilizers', 'pest', 'pests',
  'irrigation', 'mandi', 'wheat', 'rice', 'cotton', 'livestock', 'dairy',
  'weather', 'farming', 'agriculture', 'agricultural', 'farmer', 'farmers',
  'government scheme', 'scheme', 'sowing', 'harvest', 'harvesting',
  'pesticide', 'weed', 'seeds', 'cattle', 'poultry', 'organic', 'krishi',
  'kharif', 'rabi', 'zyad', 'बीज', 'खत', 'पीक', 'शेती', 'पिक',
  'pm-kisan', 'pm kisan', 'mandi price', 'disease', 'crop disease',
];

const KRISHI_SYSTEM_PROMPT = `You are the KrishiConnect AI Assistant — an agricultural expert for Indian farmers.

Your role:
- Help with crop diseases, weather advisories, government schemes (e.g. PM-Kisan), mandi prices, soil health, fertilizer recommendations, and irrigation tips.
- Use simple, clear language. If the user writes in Hinglish (Hindi + English), you may respond in Hinglish when helpful.
- Answer ONLY agriculture-related questions. If the question is not related to farming, say: "I can only help with agriculture-related questions (crops, soil, weather, schemes, mandi, etc.)."
- Never give exact chemical dosages that could be dangerous. Always recommend consulting local agricultural authorities or Krishi Vigyan Kendra before applying pesticides or chemicals.
- Respond in plain text only. Be concise and practical.`;

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

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    logger.warn('AI: GROQ_API_KEY is not set or empty');
    throw new ApiError(503, 'AI service is not configured.');
  }
  return new Groq({ apiKey: apiKey.trim() });
}

function resolveModel(modelFromRequest) {
  const name = (modelFromRequest || DEFAULT_MODEL).trim();
  if (ALLOWED_MODELS.includes(name)) return name;
  return DEFAULT_MODEL;
}

function mapGroqError(err) {
  if (err instanceof ApiError) throw err;
  const status = err.status ?? err.statusCode;
  const message = err.message || 'AI request failed';
  logger.error('Groq API error', { message: err.message, status, stack: err.stack });
  if (status === 401) throw new ApiError(503, 'AI service configuration error. Invalid API key.');
  if (status === 429) throw new ApiError(429, 'AI rate limit exceeded. Please try again later.');
  if (status === 408 || message.toLowerCase().includes('timeout')) {
    throw new ApiError(504, 'AI request timed out. Please try again.');
  }
  throw new ApiError(502, 'AI service is temporarily unavailable. Please try again later.');
}

/**
 * Non-streaming: single completion.
 */
async function ask(userId, rawQuestion, modelName = null) {
  const question = sanitizeQuestion(rawQuestion);
  if (!question || question.length < 10) {
    throw new ApiError(400, 'Validation failed');
  }
  if (!hasAgricultureContext(question)) {
    throw new ApiError(400, 'I can only help with agriculture-related questions.');
  }

  await checkAndIncrementUsage(userId);

  const client = getGroqClient();
  const model = resolveModel(modelName);

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: KRISHI_SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      max_tokens: 1024,
      temperature: 0.5,
    });

    const text = completion?.choices?.[0]?.message?.content;
    if (!text || !String(text).trim()) {
      throw new ApiError(502, 'AI response unavailable.');
    }
    return { answer: String(text).trim() };
  } catch (err) {
    mapGroqError(err);
  }
}

/**
 * Streaming: yields chunks to the provided writeChunk callback (e.g. SSE).
 * Still checks usage and agriculture context; throws on validation/usage errors.
 */
async function askStream(userId, rawQuestion, writeChunk, modelName = null) {
  const question = sanitizeQuestion(rawQuestion);
  if (!question || question.length < 10) {
    throw new ApiError(400, 'Validation failed');
  }
  if (!hasAgricultureContext(question)) {
    throw new ApiError(400, 'I can only help with agriculture-related questions.');
  }

  await checkAndIncrementUsage(userId);

  const client = getGroqClient();
  const model = resolveModel(modelName);

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: KRISHI_SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      max_tokens: 1024,
      temperature: 0.5,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (delta && typeof delta === 'string') {
        writeChunk(delta);
      }
    }
  } catch (err) {
    mapGroqError(err);
  }
}

module.exports = {
  ask,
  askStream,
  KRISHI_SYSTEM_PROMPT,
};
