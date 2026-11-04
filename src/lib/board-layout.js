// Standard QuizLadder board: 100 tiles with the same snakes, ladders and
// event squares used by the demo seeder. Copied here so create-session can
// build a board without editing the seeder.

const LADDERS = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 74: 92 };
const SNAKES = { 27: 5, 40: 3, 43: 18, 54: 31, 62: 19, 66: 45, 76: 58, 89: 53, 95: 75, 98: 78 };
const EVENTS = [7, 15, 22, 30, 45, 53, 68, 77, 85, 93];

function buildTiles(boardId) {
  const tiles = [];
  for (let n = 1; n <= 100; n += 1) {
    let tileType = 'NORMAL';
    let destination = null;
    if (LADDERS[n]) {
      tileType = 'LADDER';
      destination = LADDERS[n];
    } else if (SNAKES[n]) {
      tileType = 'SNAKE';
      destination = SNAKES[n];
    } else if (EVENTS.includes(n)) {
      tileType = 'EVENT';
    }
    tiles.push({
      board_id: boardId,
      tile_number: n,
      tile_type: tileType,
      destination_tile: destination,
    });
  }
  return tiles;
}

module.exports = { buildTiles };
