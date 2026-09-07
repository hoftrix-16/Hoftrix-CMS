/**
 * Hostinger / some Node runtimes lack global `crypto` — MongoDB driver needs it for SCRAM auth.
 */
const { webcrypto } = require('crypto');

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
}

module.exports = {};
