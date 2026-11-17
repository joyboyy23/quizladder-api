'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE question_sets
          SET owner_id = (SELECT user_id FROM users WHERE school_id = 'FAC-0042')
        WHERE owner_id IS NULL`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE question_sets SET owner_id = NULL
        WHERE owner_id = (SELECT user_id FROM users WHERE school_id = 'FAC-0042')`
    );
  },
};
