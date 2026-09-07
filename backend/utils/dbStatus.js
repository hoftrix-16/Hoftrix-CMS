const mongoose = require('mongoose');

let lastMongoError = '';

function setLastMongoError(message) {
  lastMongoError = String(message || '');
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function getLastMongoError() {
  return lastMongoError;
}

module.exports = { setLastMongoError, isDbConnected, getLastMongoError };
