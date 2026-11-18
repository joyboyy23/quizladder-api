// The only file that queries players.
const { Op } = require('sequelize');
const { Player, GameSession } = require('../models');

function findSeat(sessionId, userId, options = {}) {
  return Player.findOne({
    where: { session_id: sessionId, user_id: userId },
    ...options,
  });
}

function countBySession(sessionId, options = {}) {
  return Player.count({ where: { session_id: sessionId }, ...options });
}

function create(data) {
  return Player.create(data);
}

function findAllBySession(sessionId, options = {}) {
  return Player.findAll({
    where: { session_id: sessionId },
    order: [
      ['position', 'DESC'],
      ['player_id', 'ASC'],
    ],
    ...options,
  });
}

function listByPlayerId(sessionId, options = {}) {
  return Player.findAll({
    where: { session_id: sessionId },
    order: [['player_id', 'ASC']],
    ...options,
  });
}

function findByPlayerId(sessionId, playerId, options = {}) {
  return Player.findOne({
    where: { session_id: sessionId, player_id: playerId },
    ...options,
  });
}

function update(player, changes, options = {}) {
  return player.update(changes, options);
}

function countFinishedBySession(sessionId, options = {}) {
  return Player.count({
    where: { session_id: sessionId, finished_at: { [Op.ne]: null } },
    ...options,
  });
}

function findPlayingSeatElsewhere(userId, sessionId) {
  return Player.findOne({
    where: {
      user_id: userId,
      session_id: { [Op.ne]: sessionId },
    },
    include: [
      {
        model: GameSession,
        as: 'gameSession',
        where: { status: 'PLAYING' },
        attributes: ['join_code'],
      },
    ],
  });
}

module.exports = {
  findSeat,
  countBySession,
  create,
  findAllBySession,
  listByPlayerId,
  findByPlayerId,
  update,
  countFinishedBySession,
  findPlayingSeatElsewhere,
};
