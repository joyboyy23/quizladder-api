// Rules for game sessions. No req, no res, no queries of its own.
const sessionRepository = require('../repositories/session.repository');
const hostRepository = require('../repositories/host.repository');
const boardRepository = require('../repositories/board.repository');
const playerRepository = require('../repositories/player.repository');
const turnRepository = require('../repositories/turn.repository');
const gameplayService = require('./gameplay.service');
const questionSetService = require('./question-set.service');
const { AppError, notFound, conflict } = require('../errors/app-error');

const DEMO_HOST_USERNAME = 'librarian';
// hosts.password_hash is NOT NULL, but nobody logs in as a host: logins use users.
const HOST_PLACEHOLDER_HASH = 'no-login-service-account';
const CODE_ATTEMPTS = 10;

async function findOrFail(code) {
  const session = await sessionRepository.findByCode(code);
  if (!session) {
    throw notFound('SESSION_NOT_FOUND', `No game has the code ${code}.`);
  }
  return session;
}

function randomJoinCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function generateUniqueCode() {
  for (let i = 0; i < CODE_ATTEMPTS; i += 1) {
    const code = randomJoinCode();
    const existing = await sessionRepository.findByCode(code);
    if (!existing) return code;
  }
  throw new AppError(
    500,
    'INTERNAL_ERROR',
    'Could not generate a unique join code. Try again.'
  );
}

async function create(data) {
  await questionSetService.get(data.question_set_id);

  const host = await hostRepository.findByUsername(DEMO_HOST_USERNAME)
    || await hostRepository.findOrCreateByUsername(DEMO_HOST_USERNAME, HOST_PLACEHOLDER_HASH);

  const board = await boardRepository.createWithTiles();
  const joinCode = await generateUniqueCode();

  return sessionRepository.create({
    host_id: host.host_id,
    question_set_id: data.question_set_id,
    board_id: board.board_id,
    join_code: joinCode,
    status: 'WAITING',
  });
}

function get(code) {
  return findOrFail(code);
}

async function changeStatus(code, newStatus) {
  return sessionRepository.transaction(async (transaction) => {
    const session = await sessionRepository.lockByCode(code, transaction);
    if (!session) {
      throw notFound('SESSION_NOT_FOUND', `No game has the code ${code}.`);
    }
    const current = session.status;
    const allowed =
      (current === 'WAITING' && (newStatus === 'PLAYING' || newStatus === 'FINISHED')) ||
      (current === 'PLAYING' && newStatus === 'FINISHED');

    if (!allowed) {
      throw conflict(
        'INVALID_STATUS_TRANSITION',
        `Cannot change status from ${current} to ${newStatus}.`
      );
    }

    const now = new Date();
    if (newStatus === 'PLAYING') {
      const count = await playerRepository.countBySession(
        session.session_id,
        { transaction }
      );
      if (count < 2 || count > 4) {
        throw conflict('NOT_ENOUGH_PLAYERS', 'A game needs 2 to 4 seated players to start.');
      }
      const players = await playerRepository.listByPlayerId(
        session.session_id,
        { transaction }
      );
      return sessionRepository.update(session, {
        status: 'PLAYING',
        current_player_id: players[0].player_id,
        turn_phase: 'ROLL',
        phase_started_at: now,
        pending_question_id: null,
        started_at: now,
      }, { transaction });
    }

    if (current === 'PLAYING') {
      await gameplayService.applyExpiredTimeout(session, now, transaction);
    }
    await turnRepository.closeOpenBySession(session.session_id, now, transaction);
    return sessionRepository.update(session, {
      status: 'FINISHED',
      finished_at: now,
      current_player_id: null,
      turn_phase: null,
      phase_started_at: null,
      pending_question_id: null,
    }, { transaction });
  });
}

module.exports = { findOrFail, create, get, changeStatus };
