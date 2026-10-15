// Hub Contract rule 7: builds the results of finished games in the shared format.
// You do NOT need to change this file. Your work is in results.repository.js.
const resultsRepository = require('../repositories/results.repository');

// Ranks completed players in the order they finished (every finisher scores 100).
// An equal finish_position shares a rank: 1, 1, 3 ...
// Players who did not finish come last, by score, with no rank.
function rankPlayers(players) {
  const order = (p) => (p.completed ? p.finish_position ?? Infinity : Infinity);
  const sorted = [...players].sort((a, b) => Number(b.completed) - Number(a.completed)
    || order(a) - order(b)
    || b.score - a.score
    || a.nickname.localeCompare(b.nickname));
  let rank = 0;
  let previous;
  let seen = 0;
  return sorted.map(({ finish_position: finishPosition, ...player }) => {
    if (player.completed) {
      seen += 1;
      if (finishPosition == null || finishPosition !== previous) rank = seen;
      previous = finishPosition;
    }
    return { ...player, rank: player.completed ? rank : null };
  });
}

async function listFinishedGames(since) {
  const rows = await resultsRepository.findFinishedGamePlayers(since);

  // One entry per finished game, in the order the games ended.
  const games = new Map();
  for (const row of rows) {
    if (!games.has(row.session_code)) {
      games.set(row.session_code, {
        session_code: String(row.session_code),
        started_at: row.started_at ? new Date(row.started_at).toISOString() : null,
        ended_at: new Date(row.ended_at).toISOString(),
        players: [],
      });
    }
    games.get(row.session_code).players.push({
      school_id: String(row.school_id),
      nickname: String(row.nickname),
      score: Number(row.score),
      completed: Boolean(row.completed),
      finish_position: row.finish_position === null ? null : Number(row.finish_position),
    });
  }

  return [...games.values()]
    .sort((a, b) => a.ended_at.localeCompare(b.ended_at))
    .map((game) => {
      const players = rankPlayers(game.players);
      const podium = players
        .filter((p) => p.rank !== null && p.rank <= 3)
        .map(({ rank, school_id: schoolId, nickname, score }) => ({ rank, school_id: schoolId, nickname, score }));
      return { ...game, players, podium };
    });
}

module.exports = { listFinishedGames, rankPlayers };
