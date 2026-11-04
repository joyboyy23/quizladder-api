// Reads the validated input, calls one service function, and chooses the status.
const { matchedData } = require('express-validator');
const playerService = require('../services/player.service');
const { sessionToJson } = require('./session.controller');

function playerToJson(player) {
  return {
    player_id: Number(player.player_id),
    nickname: player.nickname,
    avatar_color: player.avatar_color,
    position: player.position,
  };
}

async function join(req, res) {
  const { code, nickname, avatar_color } = matchedData(req);
  const result = await playerService.join(code, nickname, avatar_color, req.user);
  res.status(result.created ? 201 : 200).json({
    ...playerToJson(result.player),
    rejoined: !result.created,
    session: {
      code: result.session.join_code,
      status: result.session.status,
    },
  });
}

async function list(req, res) {
  const { code } = matchedData(req);
  const result = await playerService.list(code);
  res.status(200).json({
    session: sessionToJson(result.session),
    players: result.players.map(playerToJson),
  });
}

module.exports = { join, list };
