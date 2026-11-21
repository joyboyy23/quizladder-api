const { tileTypeOf, destinationOf, buildTiles } = require('../../src/lib/board-layout');

test('tileTypeOf identifies ladders, snakes, events and normal tiles', () => {
  expect(tileTypeOf(4)).toBe('LADDER');
  expect(tileTypeOf(27)).toBe('SNAKE');
  expect(tileTypeOf(7)).toBe('EVENT');
  expect(tileTypeOf(1)).toBe('NORMAL');
  expect(tileTypeOf(100)).toBe('NORMAL');
});

test.each([[4, 25], [98, 78], [7, null]])('destinationOf(%i) is %s', (tile, expected) => {
  expect(destinationOf(tile)).toBe(expected);
});

test('buildTiles creates 100 tiles for the board', () => {
  const tiles = buildTiles(5);
  expect(tiles).toHaveLength(100);
  expect(tiles.map((tile) => tile.tile_number)).toEqual(Array.from({ length: 100 }, (_, index) => index + 1));
  expect(tiles.every((tile) => tile.board_id === 5)).toBe(true);
});

test('buildTiles has the required tile counts', () => {
  const counts = buildTiles(5).reduce((result, tile) => {
    result[tile.tile_type] = (result[tile.tile_type] || 0) + 1;
    return result;
  }, {});
  expect(counts).toEqual({ LADDER: 6, SNAKE: 10, EVENT: 10, NORMAL: 74 });
});

test('every ladder goes up', () => {
  const tiles = buildTiles(5).filter((tile) => tile.tile_type === 'LADDER');
  expect(tiles.every((tile) => tile.destination_tile > tile.tile_number)).toBe(true);
});

test('every snake goes down', () => {
  const tiles = buildTiles(5).filter((tile) => tile.tile_type === 'SNAKE');
  expect(tiles.every((tile) => tile.destination_tile < tile.tile_number)).toBe(true);
});

test('no event tile is a snake or ladder start', () => {
  const tileStarts = new Set(buildTiles(5).filter((tile) => tile.tile_type !== 'EVENT').map((tile) => tile.tile_number));
  expect(buildTiles(5).filter((tile) => tile.tile_type === 'EVENT').every((tile) => ![4, 13, 33, 42, 50, 74, 27, 40, 43, 54, 62, 66, 76, 89, 95, 98].includes(tile.tile_number))).toBe(true);
  expect(tileStarts.size).toBeGreaterThan(0);
});
