'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [sessions] = await queryInterface.sequelize.query(
        'SELECT session_id FROM game_sessions WHERE join_code = :code FOR UPDATE',
        { replacements: { code: '735104' }, transaction }
      );
      if (sessions.length !== 1) {
        throw new Error('Seeded PLAYING game 735104 was not found.');
      }

      const sessionId = sessions[0].session_id;
      const [players] = await queryInterface.sequelize.query(
        `SELECT player_id
         FROM players
         WHERE session_id = :sessionId
         ORDER BY player_id ASC
         LIMIT 1`,
        { replacements: { sessionId }, transaction }
      );
      if (players.length === 0) {
        throw new Error('Seeded PLAYING game 735104 has no players.');
      }

      const [turns] = await queryInterface.sequelize.query(
        `SELECT COALESCE(MAX(turn_number), 0) AS turn_number
         FROM turns
         WHERE session_id = :sessionId`,
        { replacements: { sessionId }, transaction }
      );
      const now = new Date();
      await queryInterface.bulkUpdate(
        'turns',
        { ended_at: now },
        { session_id: sessionId, ended_at: null },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        'game_sessions',
        {
          current_player_id: players[0].player_id,
          turn_phase: 'ROLL',
          phase_started_at: now,
          pending_question_id: null,
          turn_number: Number(turns[0].turn_number),
        },
        { session_id: sessionId },
        { transaction }
      );
    });
  },

  async down() {},
};
