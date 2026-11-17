'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('question_sets', 'owner_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'users', key: 'user_id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
    await queryInterface.addColumn('question_sets', 'cover_picture', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('question_sets', 'cover_picture');
    await queryInterface.removeColumn('question_sets', 'owner_id');
  },
};
