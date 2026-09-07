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
  '.htaccess',
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

const hostingerEnv = path.join(backendRoot, '.env.hostinger');
if (fs.existsSync(hostingerEnv)) {
  const envDest = path.join(staging, '.env');
  fs.copyFileSync(hostingerEnv, envDest);
  fs.copyFileSync(hostingerEnv, path.join(staging, 'production.env'));
  console.log('Included .env + production.env from .env.hostinger');
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);

const ps = `
$ErrorActionPreference = 'Stop'
Compress-Archive -Path (Join-Path '${staging.replace(/'/g, "''")}' '*') -DestinationPath '${outZip.replace(/'/g, "''")}' -Force
`;

execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { stdio: 'inherit' });
rimraf(staging);

console.log('✅ Created:', outZip);
