const { applyMove, nextActive, pickEvent } = require('../../src/lib/game-rules');

test.each([
  [1, 3, 4],
  [97, 3, 100],
  [98, 5, 97],
  [99, 1, 100],
  [100, 1, 99],
  [2, -3, 1],
  [1, -2, 1],
])('applyMove(%i, %i) is %i', (position, steps, expected) => {
  expect(applyMove(position, steps)).toBe(expected);
});

test('nextActive wraps from the last id to the first', () => {
  expect(nextActive([{ player_id: 10, finished_at: null }, { player_id: 11, finished_at: null }], 11).player_id).toBe(10);
});

test('nextActive skips finished players', () => {
  const result = nextActive([
    { player_id: 10, finished_at: null },
    { player_id: 11, finished_at: new Date() },
    { player_id: 12, finished_at: null },
  ], 10);
  expect(result.player_id).toBe(12);
});

test('nextActive returns null when all finished', () => {
  expect(nextActive([{ player_id: 10, finished_at: new Date() }], 10)).toBeNull();
});

test('nextActive supports string ids', () => {
  expect(nextActive([{ player_id: '10', finished_at: null }, { player_id: '11', finished_at: null }], '10').player_id).toBe('11');
});

test('nextActive supports numeric ids', () => {
  expect(nextActive([{ player_id: 10, finished_at: null }, { player_id: 11, finished_at: null }], 10).player_id).toBe(11);
});

test('pickEvent over 60 calls only returns QUESTION or PUNISHMENT', () => {
  const events = Array.from({ length: 60 }, () => pickEvent());
  expect(events.every((event) => event === 'QUESTION' || event === 'PUNISHMENT')).toBe(true);
});
