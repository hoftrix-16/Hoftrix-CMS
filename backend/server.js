const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { validateEnv } = require('./utils/validateEnv');
const { authRateLimiter } = require('./middleware/rateLimit');
validateEnv();

const authRoutes = require('./routes/authRoutes');
const erpRoutes = require('./routes/erpRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

// Middleware
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:5174', 'http://127.0.0.1:5174'];

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes — auth login/reset are rate-limited
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/forgot-password', authRateLimiter);
app.use('/api/auth/reset-password', authRateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/erp', erpRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Hoftrix CRM API',
    env: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Optional: serve built React app from same server (SERVE_FRONTEND=true)
if (process.env.SERVE_FRONTEND === 'true') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.get('/', (_req, res) => {
  res.json({
    message: 'Hoftrix Backend API is running',
    health: '/api/health',
  });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    console.log('📊 Database Name:', mongoose.connection.name);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message || err);
    if (isProduction) {
      console.error('Fix MONGODB_URI (Atlas) and redeploy.');
      process.exit(1);
    }
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Hoftrix API running on http://${HOST}:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

start();
