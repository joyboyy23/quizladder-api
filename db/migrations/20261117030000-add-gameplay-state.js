'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('game_sessions', 'current_player_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'players', key: 'player_id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
    await queryInterface.addColumn('game_sessions', 'turn_phase', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('game_sessions', 'phase_started_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('game_sessions', 'pending_question_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'questions', key: 'question_id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
    await queryInterface.addColumn('game_sessions', 'turn_number', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addConstraint('game_sessions', {
      fields: ['turn_phase'],
      type: 'check',
      name: 'game_sessions_turn_phase_check',
      where: {
        [Sequelize.Op.or]: [
          { turn_phase: null },
          { turn_phase: ['ROLL', 'QUESTION', 'PUNISH'] },
        ],
      },
    });
    await queryInterface.addConstraint('turns', {
      fields: ['session_id', 'turn_number'],
      type: 'unique',
      name: 'turns_session_id_turn_number_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('turns', 'turns_session_id_turn_number_unique');
    await queryInterface.removeConstraint('game_sessions', 'game_sessions_turn_phase_check');
    await queryInterface.removeColumn('game_sessions', 'turn_number');
    await queryInterface.removeColumn('game_sessions', 'pending_question_id');
    await queryInterface.removeColumn('game_sessions', 'phase_started_at');
    await queryInterface.removeColumn('game_sessions', 'turn_phase');
    await queryInterface.removeColumn('game_sessions', 'current_player_id');
  },
};
