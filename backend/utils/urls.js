/** Live production URLs — fallback when env vars are missing */
const LIVE = {
  FRONTEND_URL: 'https://admin.hoftrix.com',
  API_PUBLIC_URL: 'https://api.hoftrix.com',
  CORS_ORIGINS: ['https://admin.hoftrix.com', 'https://www.hoftrix.com'],
};

const LOCAL = {
  FRONTEND_URL: 'http://localhost:5173',
  API_PUBLIC_URL: 'http://localhost:5000',
  CORS_ORIGINS: ['http://localhost:5173', 'http://127.0.0.1:5173'],
};

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function getFrontendUrl() {
  const url = process.env.FRONTEND_URL || (isProduction() ? LIVE.FRONTEND_URL : LOCAL.FRONTEND_URL);
  return url.replace(/\/$/, '');
}

function getApiPublicUrl() {
  const url = process.env.API_PUBLIC_URL || (isProduction() ? LIVE.API_PUBLIC_URL : LOCAL.API_PUBLIC_URL);
  return url.replace(/\/$/, '');
}

function getCorsOrigins() {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return isProduction() ? [...LIVE.CORS_ORIGINS] : [...LOCAL.CORS_ORIGINS];
}

module.exports = { getFrontendUrl, getApiPublicUrl, getCorsOrigins };
