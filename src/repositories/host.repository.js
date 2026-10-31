// The only file that queries hosts.
const { Host } = require('../models');

function findByUsername(username) {
  return Host.findOne({ where: { username } });
}

module.exports = { findByUsername };
