jest.mock('../../src/repositories/session.repository', () => ({
  findByCode: jest.fn(),
  create: jest.fn(),
  transaction: jest.fn(),
  lockByCode: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../../src/repositories/host.repository', () => ({
  findByUsername: jest.fn(),
  findOrCreateByUsername: jest.fn(),
}));
jest.mock('../../src/repositories/board.repository', () => ({
  createWithTiles: jest.fn(),
}));
jest.mock('../../src/repositories/player.repository', () => ({
  countBySession: jest.fn(),
  listByPlayerId: jest.fn(),
}));
jest.mock('../../src/repositories/turn.repository', () => ({
  closeOpenBySession: jest.fn(),
}));
jest.mock('../../src/services/gameplay.service', () => ({
  applyExpiredTimeout: jest.fn(),
}));
jest.mock('../../src/services/question-set.service', () => ({
  get: jest.fn(),
}));

const sessionRepository = require('../../src/repositories/session.repository');
const hostRepository = require('../../src/repositories/host.repository');
const boardRepository = require('../../src/repositories/board.repository');
const playerRepository = require('../../src/repositories/player.repository');
const turnRepository = require('../../src/repositories/turn.repository');
const questionSetService = require('../../src/services/question-set.service');
const sessionService = require('../../src/services/session.service');

beforeEach(() => jest.resetAllMocks());

test('create makes the librarian host row when missing', async () => {
  questionSetService.get.mockResolvedValue({ question_set_id: 1 });
  hostRepository.findByUsername.mockResolvedValue(null);
  hostRepository.findOrCreateByUsername.mockResolvedValue({ host_id: 4 });
  boardRepository.createWithTiles.mockResolvedValue({ board_id: 2 });
  sessionRepository.findByCode.mockResolvedValue(null);
  sessionRepository.create.mockResolvedValue({ join_code: '482913' });
  await sessionService.create({ question_set_id: 1 });
  expect(hostRepository.findOrCreateByUsername).toHaveBeenCalledWith('librarian', 'no-login-service-account');
});

test('create propagates unknown set 404', async () => {
  questionSetService.get.mockRejectedValue({ status: 404, code: 'QUESTION_SET_NOT_FOUND' });
  await expect(sessionService.create({ question_set_id: 999 }))
    .rejects.toMatchObject({ status: 404, code: 'QUESTION_SET_NOT_FOUND' });
});

test('changeStatus WAITING to PLAYING with 1 player rejects', async () => {
  const session = { session_id: 1, status: 'WAITING' };
  sessionRepository.transaction.mockImplementation((callback) => callback({}));
  sessionRepository.lockByCode.mockResolvedValue(session);
  playerRepository.countBySession.mockResolvedValue(1);
  await expect(sessionService.changeStatus('482913', 'PLAYING'))
    .rejects.toMatchObject({ status: 409, code: 'NOT_ENOUGH_PLAYERS' });
});

test('changeStatus rejects FINISHED to PLAYING', async () => {
  sessionRepository.transaction.mockImplementation((callback) => callback({}));
  sessionRepository.lockByCode.mockResolvedValue({ session_id: 1, status: 'FINISHED' });
  await expect(sessionService.changeStatus('482913', 'PLAYING'))
    .rejects.toMatchObject({ status: 409, code: 'INVALID_STATUS_TRANSITION' });
});

test('PLAYING sets current player and ROLL phase', async () => {
  const session = { session_id: 1, status: 'WAITING' };
  const transaction = {};
  sessionRepository.transaction.mockImplementation((callback) => callback(transaction));
  sessionRepository.lockByCode.mockResolvedValue(session);
  playerRepository.countBySession.mockResolvedValue(2);
  playerRepository.listByPlayerId.mockResolvedValue([{ player_id: 8 }, { player_id: 11 }]);
  sessionRepository.update.mockImplementation(async (target, changes) => Object.assign(target, changes));
  await sessionService.changeStatus('482913', 'PLAYING');
  expect(sessionRepository.update).toHaveBeenCalledWith(session, expect.objectContaining({
    status: 'PLAYING',
    current_player_id: 8,
    turn_phase: 'ROLL',
  }), { transaction });
});
