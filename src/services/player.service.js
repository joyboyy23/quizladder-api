// Rules for joining and listing seats. No req, no res.
const playerRepository = require('../repositories/player.repository');
const sessionService = require('./session.service');
const gameInfo = require('../config/game-info');
const { conflict } = require('../errors/app-error');
const { constraintOf } = require('../errors/db-errors');

async function join(code, nickname, avatarColor, user) {
  const session = await sessionService.findOrFail(code);

  const seat = await playerRepository.findSeat(session.session_id, user.user_id);
  if (seat) {
    return { session, player: seat, created: false };
  }

  const elsewhere = await playerRepository.findPlayingSeatElsewhere(
    user.user_id,
    session.session_id
  );
  if (elsewhere) {
    throw conflict(
      'ALREADY_IN_GAME',
      'You are still playing another game. Finish it first.'
    );
  }

  if (session.status === 'FINISHED') {
    throw conflict('SESSION_ENDED', 'This game has ended.');
  }
  if (session.status !== 'WAITING') {
    throw conflict('SESSION_NOT_JOINABLE', 'This game has already started.');
  }

  const seatsTaken = await playerRepository.countBySession(session.session_id);
  if (seatsTaken >= gameInfo.max_players) {
    throw conflict('SESSION_FULL', 'This game is full.');
  }

  try {
    const player = await playerRepository.create({
      session_id: session.session_id,
      user_id: user.user_id,
      nickname,
      avatar_color: avatarColor,
    });
    return { session, player, created: true };
  } catch (err) {
    // Same account racing several joins: one seat wins, the rest rejoin.
    if (constraintOf(err) === 'players_session_id_user_id_unique') {
      const existing = await playerRepository.findSeat(session.session_id, user.user_id);
      if (existing) {
        return { session, player: existing, created: false };
      }
    }
    throw err;
  }
}

async function list(code) {
  const session = await sessionService.findOrFail(code);
  const players = await playerRepository.findAllBySession(session.session_id);
  return { session, players };
}

module.exports = { join, list };
