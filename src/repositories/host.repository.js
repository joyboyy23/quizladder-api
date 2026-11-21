// The only file that queries hosts.
const { Host } = require('../models');

function findByUsername(username) {
  return Host.findOne({ where: { username } });
}

async function findOrCreateByUsername(username, passwordHash) {
  const [host] = await Host.findOrCreate({ where: { username }, defaults: { password_hash: passwordHash } });
  return host;
}

module.exports = { findByUsername, findOrCreateByUsername };
