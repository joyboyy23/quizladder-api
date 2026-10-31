// The only file that queries players.
const { Op } = require('sequelize');
const { Player, GameSession } = require('../models');

function findSeat(sessionId, userId) {
  return Player.findOne({
    where: { session_id: sessionId, user_id: userId },
  });
}

function countBySession(sessionId) {
  return Player.count({ where: { session_id: sessionId } });
}

function create(data) {
  return Player.create(data);
}

function findAllBySession(sessionId) {
  return Player.findAll({
    where: { session_id: sessionId },
    order: [
      ['position', 'DESC'],
      ['player_id', 'ASC'],
    ],
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
  findPlayingSeatElsewhere,
};
