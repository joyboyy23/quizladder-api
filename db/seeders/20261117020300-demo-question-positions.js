'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE questions AS q
          SET position = ranked.rn
         FROM (SELECT question_id,
                      ROW_NUMBER() OVER (PARTITION BY question_set_id ORDER BY question_id) AS rn
                 FROM questions
                WHERE position IS NULL) AS ranked
        WHERE q.question_id = ranked.question_id`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('UPDATE questions SET position = NULL');
  },
};
