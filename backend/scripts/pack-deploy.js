/**
 * Creates backend-deploy.zip at project root for Hostinger "Deployment from files".
 * Zip root contains server.js + package.json (no nested backend/ folder, no node_modules).
 *
 * Usage (from repo root or backend folder):
 *   node backend/scripts/pack-deploy.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');
const outZip = path.join(repoRoot, 'backend-deploy.zip');
const staging = path.join(backendRoot, '.deploy-staging');

const INCLUDE = [
  'server.js',
  'seed.js',
  'package.json',
  'package-lock.json',
  'models',
  'routes',
  'middleware',
  'utils',
  'uploads',
];

function rimraf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      if (name === 'node_modules' || name === '.deploy-staging') continue;
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

rimraf(staging);
fs.mkdirSync(staging, { recursive: true });

for (const item of INCLUDE) {
  const src = path.join(backendRoot, item);
  if (item === 'uploads') {
    fs.mkdirSync(path.join(staging, 'uploads'), { recursive: true });
    fs.writeFileSync(path.join(staging, 'uploads', '.gitkeep'), '');
    continue;
  }
  if (!fs.existsSync(src)) {
    console.warn('Skip missing:', item);
    continue;
  }
  copyRecursive(src, path.join(staging, item));
}

// Prefer Hostinger env template if present (user must still set real Mongo URI)
const hostingerEnv = path.join(backendRoot, '.env.hostinger');
if (fs.existsSync(hostingerEnv)) {
  fs.copyFileSync(hostingerEnv, path.join(staging, '.env'));
  console.log('Included .env from .env.hostinger (replace MONGODB_URI before/after upload!)');
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);

const ps = `
$ErrorActionPreference = 'Stop'
Compress-Archive -Path (Join-Path '${staging.replace(/'/g, "''")}' '*') -DestinationPath '${outZip.replace(/'/g, "''")}' -Force
`;

execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { stdio: 'inherit' });
rimraf(staging);

console.log('✅ Created:', outZip);
console.log('Upload this zip to Hostinger. Zip root has server.js (not backend/server.js).');
console.log('Before deploy works: set real MONGODB_URI (Atlas) in Hostinger env or in .env.hostinger then re-run pack.');
