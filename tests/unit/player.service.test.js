jest.mock('../../src/repositories/player.repository', () => ({
  findSeat: jest.fn(),
  findPlayingSeatElsewhere: jest.fn(),
  countBySession: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../src/services/session.service', () => ({
  findOrFail: jest.fn(),
}));

const playerRepository = require('../../src/repositories/player.repository');
const sessionService = require('../../src/services/session.service');
const playerService = require('../../src/services/player.service');
const { UniqueConstraintError } = require('sequelize');

beforeEach(() => jest.resetAllMocks());

test('existing seat is returned with created false', async () => {
  sessionService.findOrFail.mockResolvedValue({ session_id: 1, status: 'WAITING' });
  playerRepository.findSeat.mockResolvedValue({ player_id: 10 });
  await expect(playerService.join('482913', 'Ana', 'BLUE', { user_id: 5 }))
    .resolves.toMatchObject({ created: false, player: { player_id: 10 } });
  expect(playerRepository.create).not.toHaveBeenCalled();
});

test('seated elsewhere in PLAYING game rejects ALREADY_IN_GAME', async () => {
  sessionService.findOrFail.mockResolvedValue({ session_id: 1, status: 'WAITING' });
  playerRepository.findSeat.mockResolvedValue(null);
  playerRepository.findPlayingSeatElsewhere.mockResolvedValue({ player_id: 8 });
  await expect(playerService.join('482913', 'Ana', 'BLUE', { user_id: 5 }))
    .rejects.toMatchObject({ status: 409, code: 'ALREADY_IN_GAME' });
});

test('FINISHED game rejects SESSION_ENDED', async () => {
  sessionService.findOrFail.mockResolvedValue({ session_id: 1, status: 'FINISHED' });
  playerRepository.findSeat.mockResolvedValue(null);
  await expect(playerService.join('482913', 'Ana', 'BLUE', { user_id: 5 }))
    .rejects.toMatchObject({ status: 409, code: 'SESSION_ENDED' });
});

test('PLAYING game rejects SESSION_NOT_JOINABLE', async () => {
  sessionService.findOrFail.mockResolvedValue({ session_id: 1, status: 'PLAYING' });
  playerRepository.findSeat.mockResolvedValue(null);
  await expect(playerService.join('482913', 'Ana', 'BLUE', { user_id: 5 }))
    .rejects.toMatchObject({ status: 409, code: 'SESSION_NOT_JOINABLE' });
});

test('full game rejects SESSION_FULL', async () => {
  sessionService.findOrFail.mockResolvedValue({ session_id: 1, status: 'WAITING' });
  playerRepository.findSeat.mockResolvedValue(null);
  playerRepository.countBySession.mockResolvedValue(4);
  await expect(playerService.join('482913', 'Ana', 'BLUE', { user_id: 5 }))
    .rejects.toMatchObject({ status: 409, code: 'SESSION_FULL' });
});

test('success returns created true', async () => {
  sessionService.findOrFail.mockResolvedValue({ session_id: 1, status: 'WAITING' });
  playerRepository.findSeat.mockResolvedValue(null);
  playerRepository.countBySession.mockResolvedValue(1);
  playerRepository.create.mockResolvedValue({ player_id: 10 });
  await expect(playerService.join('482913', 'Ana', 'BLUE', { user_id: 5 }))
    .resolves.toMatchObject({ created: true });
});

test('unique race returns the existing seat', async () => {
  sessionService.findOrFail.mockResolvedValue({ session_id: 1, status: 'WAITING' });
  playerRepository.findSeat.mockResolvedValueOnce(null).mockResolvedValueOnce({ player_id: 10 });
  playerRepository.countBySession.mockResolvedValue(1);
  const error = new UniqueConstraintError({
    message: 'duplicate',
    errors: [],
    parent: { constraint: 'players_session_id_user_id_unique' },
  });
  playerRepository.create.mockRejectedValue(error);
  await expect(playerService.join('482913', 'Ana', 'BLUE', { user_id: 5 }))
    .resolves.toMatchObject({ created: false, player: { player_id: 10 } });
});
