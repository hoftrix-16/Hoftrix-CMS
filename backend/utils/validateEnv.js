const WEAK_JWT_SECRETS = new Set([
  'change_this_to_a_long_random_secret',
  'hoftrix_dev_secret_change_me',
  'hoftrix_jwt_dev_secret_change_in_production',
  'hoftrix_secret',
  'hello_world_jwt_secret_change',
  'yahan_lamba_random_secret_dalna_hai',
]);

function looksLikePlaceholder(value = '') {
  const v = String(value);
  return (
    /USER:PASSWORD/i.test(v) ||
    /REPLACE_USER|REPLACE_PASSWORD|REPLACE_CLUSTER/i.test(v) ||
    /YOUR-TEMP-BACKEND-URL/i.test(v) ||
    /YOUR-BACKEND-URL/i.test(v) ||
    /yourdomain\.com/i.test(v)
  );
}

function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const requiredAlways = ['MONGODB_URI'];
  const requiredProduction = ['JWT_SECRET', 'DEFAULT_EMPLOYEE_PASSWORD'];

  const missing = requiredAlways.filter((key) => !process.env[key]);
  if (isProduction) {
    missing.push(...requiredProduction.filter((key) => !process.env[key]));
  }

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    if (isProduction) {
      console.error('Server will start but API calls may fail until env vars are set in Hostinger panel.');
    } else {
      process.exit(1);
    }
  }

  if (isProduction && process.env.JWT_SECRET && WEAK_JWT_SECRETS.has(process.env.JWT_SECRET)) {
    console.warn('⚠️  JWT_SECRET is weak — set a strong secret in production.');
  }

  if (isProduction && process.env.MONGODB_URI && looksLikePlaceholder(process.env.MONGODB_URI)) {
    console.error('❌ MONGODB_URI still has placeholder USER/PASSWORD.');
  }

  if (isProduction && process.env.API_PUBLIC_URL && looksLikePlaceholder(process.env.API_PUBLIC_URL)) {
    console.warn('⚠️  API_PUBLIC_URL looks like a placeholder. Uploads/links may break until you set your real backend URL.');
  }
}

module.exports = { validateEnv };
