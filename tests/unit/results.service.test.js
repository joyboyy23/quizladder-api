jest.mock('../../src/repositories/results.repository', () => ({
  findFinishedGamePlayers: jest.fn(),
}));

const resultsRepository = require('../../src/repositories/results.repository');
const { rankPlayers, listFinishedGames } = require('../../src/services/results.service');

test('rankPlayers gives shared ranks and skips the next rank', () => {
  const ranked = rankPlayers([
    { nickname: 'Ana', score: 100, completed: true, finish_position: 1 },
    { nickname: 'Ben', score: 100, completed: true, finish_position: 1 },
    { nickname: 'Carla', score: 100, completed: true, finish_position: 3 },
  ]);
  expect(ranked.map((player) => player.rank)).toEqual([1, 1, 3]);
});

test('rankPlayers gives finish order 1,2,3', () => {
  const ranked = rankPlayers([
    { nickname: 'A', score: 100, completed: true, finish_position: 1 },
    { nickname: 'B', score: 100, completed: true, finish_position: 2 },
    { nickname: 'C', score: 100, completed: true, finish_position: 3 },
  ]);
  expect(ranked.map((player) => player.rank)).toEqual([1, 2, 3]);
});

test('rankPlayers puts incomplete players last with rank null even with a higher score', () => {
  const ranked = rankPlayers([
    { nickname: 'A', score: 100, completed: true, finish_position: 1 },
    { nickname: 'Dino', score: 9000, completed: false, finish_position: null },
  ]);
  expect(ranked[0].nickname).toBe('A');
  expect(ranked[1]).toMatchObject({ nickname: 'Dino', rank: null });
});

test('ranked output does not contain finish_position', () => {
  expect(rankPlayers([{ nickname: 'A', score: 100, completed: true, finish_position: 1 }])[0])
    .not.toHaveProperty('finish_position');
});

test('listFinishedGames maps one game and passes since unchanged', async () => {
  const since = '2026-01-01T00:00:00Z';
  resultsRepository.findFinishedGamePlayers.mockResolvedValue([
    { session_code: '482913', school_id: '2023-00123', nickname: 'Ana', score: 100, completed: true, finish_position: 1, started_at: '2026-01-01T00:00:00Z', ended_at: '2026-01-01T01:00:00Z' },
    { session_code: '482913', school_id: '2023-00456', nickname: 'Ben', score: 100, completed: true, finish_position: 2, started_at: '2026-01-01T00:00:00Z', ended_at: '2026-01-01T01:00:00Z' },
    { session_code: '482913', school_id: '2023-00789', nickname: 'Carla', score: 100, completed: true, finish_position: 3, started_at: '2026-01-01T00:00:00Z', ended_at: '2026-01-01T01:00:00Z' },
    { session_code: '482913', school_id: '2024-00111', nickname: 'Dino', score: 87, completed: false, finish_position: null, started_at: '2026-01-01T00:00:00Z', ended_at: '2026-01-01T01:00:00Z' },
  ]);
  const games = await listFinishedGames(since);
  expect(resultsRepository.findFinishedGamePlayers).toHaveBeenCalledWith(since);
  expect(games).toHaveLength(1);
  expect(games[0].players).toHaveLength(4);
  expect(games[0].podium).toHaveLength(3);
  expect(games[0].podium.map((player) => player.rank)).toEqual([1, 2, 3]);
  expect(new Date(games[0].started_at).toISOString()).toBe(games[0].started_at);
  expect(new Date(games[0].ended_at).toISOString()).toBe(games[0].ended_at);
});
