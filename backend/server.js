require('./utils/cryptoFix');
require('./utils/dnsFix');
const fs = require('fs');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env')
});

const express = require('express');
const mongoose = require('mongoose');

// Fail fast — no 10 second buffering timeout on login
mongoose.set('bufferCommands', false);

const cors = require('cors');
const helmet = require('helmet');

const { validateEnv } = require('./utils/validateEnv');
const { authRateLimiter } = require('./middleware/rateLimit');
const { getCorsOrigins, getApiPublicUrl, getFrontendUrl } = require('./utils/urls');
const { setLastMongoError, isDbConnected, getLastMongoError } = require('./utils/dbStatus');

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

const corsOrigins = getCorsOrigins();
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/forgot-password', authRateLimiter);
app.use('/api/auth/reset-password', authRateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/erp', erpRoutes);

app.get('/api/health', async (_req, res) => {
  if (!isDbConnected()) {
    await connectMongo();
  }
  const connected = isDbConnected();
  res.json({
    status: 'ok',
    service: 'Hoftrix CRM API',
    env: process.env.NODE_ENV || 'development',
    port: PORT,
    database: connected ? 'connected' : 'disconnected',
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    mongoError: connected ? undefined : getLastMongoError() || 'Connection failed',
    frontend: getFrontendUrl(),
    api: getApiPublicUrl(),
  });
});

function resolveDistPath() {
  const candidates = [path.join(__dirname, 'dist'), path.join(__dirname, '..', 'dist')];
  return candidates.find((p) => fs.existsSync(path.join(p, 'index.html')));
}

const serveFrontend = process.env.SERVE_FRONTEND === 'true';
const distPath = serveFrontend ? resolveDistPath() : null;

if (distPath) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.get('/', (_req, res) => {
  if (distPath) return res.sendFile(path.join(distPath, 'index.html'));
  res.json({ message: 'Hoftrix Backend API is running', health: '/api/health', frontend: getFrontendUrl() });
});

async function connectMongo() {
  if (isDbConnected()) return true;

  const uris = [process.env.MONGODB_URI, process.env.MONGODB_URI_DIRECT].filter(Boolean);
  if (uris.length === 0) {
    setLastMongoError('MONGODB_URI missing — set in Hostinger env vars or upload .env file');
    console.error('❌ MONGODB_URI is missing');
    return false;
  }

  const options = { serverSelectionTimeoutMS: 15000, family: 4 };

  for (const uri of uris) {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => {});
      }
      await mongoose.connect(uri, options);
      setLastMongoError('');
      console.log('✅ MongoDB Connected:', mongoose.connection.name);
      return true;
    } catch (err) {
      const message = err.message || String(err);
      setLastMongoError(message);
      console.error('❌ MongoDB Error:', message);
    }
  }

  return false;
}

async function start() {
  console.log('🔌 Connecting MongoDB before starting server...');
  console.log('   MONGODB_URI set:', Boolean(process.env.MONGODB_URI));

  await connectMongo();

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Hoftrix API on http://${HOST}:${PORT} (${process.env.NODE_ENV || 'development'})`);
    console.log(`🌐 Frontend: ${getFrontendUrl()} | API: ${getApiPublicUrl()}`);
    console.log(`📊 Database: ${isDbConnected() ? 'connected' : 'DISCONNECTED'}`);
  });

  setInterval(() => {
    if (!isDbConnected()) connectMongo();
  }, 30000);
}

start();
