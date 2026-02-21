require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const hpp = require('hpp');

const { generalLimiter } = require('./middlewares/rateLimit.middleware');
const errorHandler = require('./middlewares/error.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const postRoutes = require('./modules/post/post.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const qaRoutes = require('./modules/qa/qa.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const marketRoutes = require('./modules/market/market.routes');
const weatherRoutes = require('./modules/weather/weather.routes');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(hpp({ whitelist: ['tags', 'crops', 'categories'] }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(generalLimiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/qa', qaRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/market', marketRoutes);
app.use('/api/v1/weather', weatherRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
