/**
 * One-time local setup for a new machine / shared project copy.
 * Copies example env files and seeds the default admin user.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'backend');

function copyIfMissing(src, dest, label) {
  if (fs.existsSync(dest)) {
    console.log(`✓ ${label} already exists`);
    return;
  }
  if (!fs.existsSync(src)) {
    console.warn(`⚠ Missing template: ${src}`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`✓ Created ${label}`);
}

console.log('\n🔧 Hoftrix local setup\n');

copyIfMissing(path.join(root, '.env.example'), path.join(root, '.env'), 'frontend .env');
copyIfMissing(path.join(root, '.env.example'), path.join(root, '.env.development'), 'frontend .env.development');
copyIfMissing(path.join(backend, '.env.example'), path.join(backend, '.env'), 'backend .env');

// Ensure local API URL on frontend envs
for (const feEnv of [path.join(root, '.env'), path.join(root, '.env.development')]) {
  if (!fs.existsSync(feEnv)) continue;
  let text = fs.readFileSync(feEnv, 'utf8');
  if (!/VITE_API_URL=/.test(text)) {
    text += '\nVITE_API_URL=http://localhost:5000/api\n';
    fs.writeFileSync(feEnv, text);
  } else {
    text = text.replace(/VITE_API_URL=.*/g, 'VITE_API_URL=http://localhost:5000/api');
    fs.writeFileSync(feEnv, text);
  }
}

console.log('\n📦 Installing root + backend deps...');
execSync('npm install', { cwd: root, stdio: 'inherit' });
execSync('npm install', { cwd: backend, stdio: 'inherit' });

console.log('\n🌱 Seeding admin user...');
try {
  execSync('node seed.js', { cwd: backend, stdio: 'inherit' });
} catch {
  console.error('\n❌ Seed failed. Is MongoDB running on mongodb://127.0.0.1:27017 ?');
  console.error('   Install MongoDB Community OR start MongoDB service, then run: npm run seed');
  process.exit(1);
}

console.log(`
✅ Setup done.

Next:
  1) Terminal A:  cd backend && npm run dev
  2) Terminal B:  npm run dev
  3) Open: http://localhost:5173

Login:
  Email   : hoftrix16@gmail.com
  Password: Ashu123@
`);
