// UNIT tests for the gameplay rules: the repositories are replaced, so no database is used.
jest.mock('../../src/repositories/session.repository', () => ({
  transaction: jest.fn(), lockByCode: jest.fn(), update: jest.fn(),
}));
jest.mock('../../src/repositories/player.repository', () => ({
  findSeat: jest.fn(), findByPlayerId: jest.fn(), listByPlayerId: jest.fn(),
  countBySession: jest.fn(), countFinishedBySession: jest.fn(), update: jest.fn(),
}));
jest.mock('../../src/repositories/turn.repository', () => ({
  create: jest.fn(), update: jest.fn(), findOpenBySession: jest.fn(),
  findAskedQuestionIds: jest.fn(), closeOpenBySession: jest.fn(),
}));
jest.mock('../../src/repositories/question.repository', () => ({
  findInSet: jest.fn(), findAllForGame: jest.fn(),
}));

const sessionRepository = require('../../src/repositories/session.repository');
const playerRepository = require('../../src/repositories/player.repository');
const turnRepository = require('../../src/repositories/turn.repository');
const questionRepository = require('../../src/repositories/question.repository');
const gameplayService = require('../../src/services/gameplay.service');

const TX = { LOCK: { UPDATE: 'UPDATE' } };
const seat = (extra = {}) => ({ player_id: 10, position: 1, finished_at: null, ...extra });
const rival = { player_id: 11, position: 1, finished_at: null };
let session;

beforeEach(() => {
  jest.resetAllMocks();
  session = {
    session_id: 1, status: 'PLAYING', current_player_id: 10, turn_phase: 'ROLL',
    phase_started_at: new Date(), turn_number: 0, question_set_id: 1, pending_question_id: null,
  };
  sessionRepository.transaction.mockImplementation((callback) => callback(TX));
  sessionRepository.lockByCode.mockResolvedValue(session);
  sessionRepository.update.mockImplementation(async (target, changes) => Object.assign(target, changes));
  turnRepository.create.mockResolvedValue({ turn_id: 1 });
  turnRepository.update.mockResolvedValue({});
  playerRepository.countBySession.mockResolvedValue(2);
  playerRepository.countFinishedBySession.mockResolvedValue(0);
  playerRepository.listByPlayerId.mockResolvedValue([seat(), rival]);
});

test('roll refuses a player without a seat', async () => {
  playerRepository.findSeat.mockResolvedValue(null);
  await expect(gameplayService.roll('482913', 5)).rejects.toMatchObject({ status: 403, code: 'NOT_SEATED' });
  expect(turnRepository.create).not.toHaveBeenCalled();
});

test('roll refuses another player', async () => {
  playerRepository.findSeat.mockResolvedValue(rival);
  await expect(gameplayService.roll('482913', 5, { dice: 3 })).rejects.toMatchObject({ status: 409, code: 'NOT_YOUR_TURN' });
});

test('roll refuses WAITING games', async () => {
  session.status = 'WAITING';
  playerRepository.findSeat.mockResolvedValue(seat());
  await expect(gameplayService.roll('482913', 5, { dice: 3 })).rejects.toMatchObject({ status: 409, code: 'GAME_NOT_PLAYING' });
});

test('roll refuses WRONG_PHASE outside ROLL', async () => {
  session.turn_phase = 'QUESTION';
  playerRepository.findSeat.mockResolvedValue(seat());
  await expect(gameplayService.roll('482913', 5, { dice: 3 })).rejects.toMatchObject({ status: 409, code: 'WRONG_PHASE' });
});

test('roll 3 from tile 1 climbs ladder to 25 and passes the turn', async () => {
  playerRepository.findSeat.mockResolvedValue(seat());
  const result = await gameplayService.roll('482913', 5, { dice: 3 });
  expect(result).toMatchObject({ dice: 3, from: 1, to: 25, tile_type: 'LADDER', snake_or_ladder_to: 25, finished: false, next_phase: 'ROLL' });
  expect(sessionRepository.update).toHaveBeenCalledWith(session,
    expect.objectContaining({ current_player_id: 11, turn_phase: 'ROLL' }), { transaction: TX });
});

test('first player to land on 100 gets finish_position 1', async () => {
  const me = seat({ position: 94 });
  playerRepository.findSeat.mockResolvedValue(me);
  playerRepository.countFinishedBySession.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
  const result = await gameplayService.roll('482913', 5, { dice: 6 });
  expect(result.finished).toBe(true);
  expect(playerRepository.update).toHaveBeenCalledWith(me,
    expect.objectContaining({ position: 100, finish_position: 1 }), { transaction: TX });
});

test('last finisher ends the session', async () => {
  const me = seat({ position: 94 });
  playerRepository.findSeat.mockResolvedValue(me);
  playerRepository.countBySession.mockResolvedValue(2);
  playerRepository.countFinishedBySession.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
  await gameplayService.roll('482913', 5, { dice: 6 });
  expect(sessionRepository.update).toHaveBeenCalledWith(session, expect.objectContaining({
    status: 'FINISHED', current_player_id: null, turn_phase: null,
  }), { transaction: TX });
});

test('correct answer moves +2', async () => {
  session.turn_phase = 'QUESTION';
  session.pending_question_id = 3;
  const me = seat({ position: 7 });
  playerRepository.findSeat.mockResolvedValue(me);
  turnRepository.findOpenBySession.mockResolvedValue({ turn_id: 5 });
  questionRepository.findInSet.mockResolvedValue({
    question_id: 3,
    answers: [{ choice_index: 1, is_correct: true }, { choice_index: 2, is_correct: false }],
  });
  const result = await gameplayService.answer('482913', 5, 1);
  expect(result).toMatchObject({ correct: true, from: 7, to: 9 });
});

test('wrong answer moves -2', async () => {
  session.turn_phase = 'QUESTION';
  session.pending_question_id = 3;
  const me = seat({ position: 7 });
  playerRepository.findSeat.mockResolvedValue(me);
  turnRepository.findOpenBySession.mockResolvedValue({ turn_id: 5 });
  questionRepository.findInSet.mockResolvedValue({
    question_id: 3,
    answers: [{ choice_index: 1, is_correct: true }, { choice_index: 2, is_correct: false }],
  });
  const result = await gameplayService.answer('482913', 5, 2);
  expect(result).toMatchObject({ correct: false, from: 7, to: 5 });
});

test('answer after deadline rejects ANSWER_TOO_LATE', async () => {
  session.turn_phase = 'QUESTION';
  session.phase_started_at = new Date(Date.now() - 16000);
  playerRepository.findByPlayerId.mockResolvedValue(seat());
  turnRepository.findOpenBySession.mockResolvedValue({ turn_id: 5 });
  await expect(gameplayService.answer('482913', 5, 1))
    .rejects.toMatchObject({ status: 409, code: 'ANSWER_TOO_LATE' });
});

test('punish rejects the caller as target', async () => {
  session.turn_phase = 'PUNISH';
  playerRepository.findSeat.mockResolvedValue(seat());
  playerRepository.findByPlayerId.mockResolvedValue(seat());
  await expect(gameplayService.punish('482913', 5, 10, 2))
    .rejects.toMatchObject({ status: 409, code: 'INVALID_TARGET' });
});

test('punish moves a valid target back without going below 1', async () => {
  session.turn_phase = 'PUNISH';
  playerRepository.findSeat.mockResolvedValue(seat({ position: 10 }));
  playerRepository.findByPlayerId.mockResolvedValue(rival);
  turnRepository.findOpenBySession.mockResolvedValue({ turn_id: 5 });
  const result = await gameplayService.punish('482913', 5, 11, 2);
  expect(result).toMatchObject({ from: 1, to: 1 });
  expect(result.to).toBeGreaterThanOrEqual(1);
});

test('expired ROLL records a skipped turn', async () => {
  session.turn_phase = 'ROLL';
  session.phase_started_at = new Date(Date.now() - 11000);
  playerRepository.findByPlayerId.mockResolvedValue(seat());
  const result = await gameplayService.applyExpiredTimeout(session, new Date(), TX);
  expect(result).toMatchObject({ applied: true, phase: 'ROLL' });
  expect(turnRepository.create).toHaveBeenCalledWith(expect.objectContaining({ dice_result: null }), TX);
});

test('expired QUESTION moves back 3', async () => {
  session.turn_phase = 'QUESTION';
  session.phase_started_at = new Date(Date.now() - 16000);
  const me = seat({ position: 10 });
  playerRepository.findByPlayerId.mockResolvedValue(me);
  turnRepository.findOpenBySession.mockResolvedValue({ turn_id: 5 });
  const result = await gameplayService.applyExpiredTimeout(session, new Date(), TX);
  expect(result).toMatchObject({ applied: true, phase: 'QUESTION' });
  expect(playerRepository.update).toHaveBeenCalledWith(me, { position: 7 }, { transaction: TX });
});

test('expired PUNISH ends the turn with no movement', async () => {
  session.turn_phase = 'PUNISH';
  session.phase_started_at = new Date(Date.now() - 11000);
  playerRepository.findByPlayerId.mockResolvedValue(seat({ position: 10 }));
  turnRepository.findOpenBySession.mockResolvedValue({ turn_id: 5 });
  const result = await gameplayService.applyExpiredTimeout(session, new Date(), TX);
  expect(result).toMatchObject({ applied: true, phase: 'PUNISH' });
  expect(playerRepository.update).not.toHaveBeenCalled();
});

test('applyExpiredTimeout returns false before deadline', async () => {
  const result = await gameplayService.applyExpiredTimeout(session, new Date(), TX);
  expect(result).toEqual({ applied: false });
});
