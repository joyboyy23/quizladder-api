// Rules for game sessions. No req, no res, no queries of its own.
const sessionRepository = require('../repositories/session.repository');
const hostRepository = require('../repositories/host.repository');
const boardRepository = require('../repositories/board.repository');
const questionSetService = require('./question-set.service');
const { AppError, notFound, conflict } = require('../errors/app-error');

const DEMO_HOST_USERNAME = 'librarian';
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

  const host = await hostRepository.findByUsername(DEMO_HOST_USERNAME);
  if (!host) {
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      'Demo host is missing. Re-seed the database.'
    );
  }

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
  const session = await findOrFail(code);
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

  const changes = { status: newStatus };
  if (newStatus === 'PLAYING') {
    changes.started_at = new Date();
  }
  if (newStatus === 'FINISHED') {
    changes.finished_at = new Date();
  }

  return sessionRepository.update(session, changes);
}

module.exports = { findOrFail, create, get, changeStatus };
