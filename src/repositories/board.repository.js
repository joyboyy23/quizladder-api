// The only file that writes boards and tiles for a new session.
const { Board, Tile } = require('../models');
const { buildTiles } = require('../lib/board-layout');

async function createWithTiles() {
  const board = await Board.create({ size: 100 });
  await Tile.bulkCreate(buildTiles(board.board_id));
  return board;
}

module.exports = { createWithTiles };
