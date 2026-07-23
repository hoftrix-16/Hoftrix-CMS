/**
 * PM2 production config — Hoftrix CRM
 *
 * Setup:
 *   1. Copy backend/.env.example → backend/.env (fill production values)
 *   2. npm run build
 *   3. pm2 start ecosystem.config.cjs
 *
 * Optional single-server mode: set SERVE_FRONTEND=true in backend/.env
 */
module.exports = {
  apps: [
    {
      name: 'hoftrix-api',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
