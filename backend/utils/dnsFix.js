/**
 * Some Windows/router DNS setups break MongoDB Atlas SRV lookup (querySrv ECONNREFUSED).
 * Prefer public DNS resolvers before any mongoose.connect().
 */
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // ignore — fall back to system DNS
}

module.exports = {};
