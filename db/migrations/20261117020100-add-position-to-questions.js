'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('questions', 'position', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addConstraint('questions', {
      fields: ['question_set_id', 'position'],
      type: 'unique',
      name: 'questions_question_set_id_position_unique',
    });
    await queryInterface.addConstraint('questions', {
      fields: ['position'],
      type: 'check',
      name: 'questions_position_check',
      where: { position: { [Sequelize.Op.between]: [1, 1000] } },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('questions', 'questions_position_check');
    await queryInterface.removeConstraint('questions', 'questions_question_set_id_position_unique');
    await queryInterface.removeColumn('questions', 'position');
  },
};
