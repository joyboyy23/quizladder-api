module.exports = (sequelize, DataTypes) => {
    const GameSession = sequelize.define(
      'GameSession',
      {
        session_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
  
        host_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
  
        question_set_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
  
        board_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          unique: true,
        },
  
        join_code: {
          type: DataTypes.CHAR(6),
          allowNull: false,
          unique: true,
        },
  
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'WAITING',
          validate: {
            isIn: [['WAITING', 'PLAYING', 'FINISHED']],
          },
        },

        current_player_id: {
          type: DataTypes.BIGINT,
          allowNull: true,
        },

        turn_phase: {
          type: DataTypes.STRING(20),
          allowNull: true,
          validate: {
            isIn: [['ROLL', 'QUESTION', 'PUNISH']],
          },
        },

        phase_started_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },

        pending_question_id: {
          type: DataTypes.BIGINT,
          allowNull: true,
        },

        turn_number: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
  
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
  
        started_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        finished_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        tableName: 'game_sessions',
        timestamps: false,
        freezeTableName: true,
      }
    );
  
    return GameSession;
  };