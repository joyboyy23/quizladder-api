const { randomInt } = require('node:crypto');

function applyMove(position, steps) {
  const destination = position + steps;
  return Math.max(1, destination > 100 ? 200 - destination : destination);
}

function comparePlayerIds(a, b) {
  const first = BigInt(a);
  const second = BigInt(b);
  if (first < second) return -1;
  if (first > second) return 1;
  return 0;
}

function nextActive(players, currentId) {
  const active = players
    .filter((player) => player.finished_at === null || player.finished_at === undefined)
    .sort((a, b) => comparePlayerIds(a.player_id, b.player_id));
  if (active.length === 0) return null;

  const currentIndex = active.findIndex(
    (player) => comparePlayerIds(player.player_id, currentId) === 0
  );
  return active[(currentIndex + 1) % active.length];
}

function pickEvent() {
  return randomInt(0, 2) === 0 ? 'QUESTION' : 'PUNISHMENT';
}

module.exports = { applyMove, nextActive, pickEvent };
