module.exports = (sequelize, DataTypes) => {
    const Turn = sequelize.define(
      'Turn',
      {
        turn_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
  
        session_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
  
        player_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
  
        turn_number: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
  
        dice_result: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
            max: 6,
          },
        },
  
        event_type: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'NONE',
          validate: {
            isIn: [['NONE', 'QUESTION', 'PUNISHMENT']],
          },
        },
  
        event_target_player_id: {
          type: DataTypes.BIGINT,
          allowNull: true,
        },
  
        event_amount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: -6,
            max: 2,
          },
        },
  
        question_id: {
          type: DataTypes.BIGINT,
          allowNull: true,
        },
  
        started_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
  
        ended_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        tableName: 'turns',
        timestamps: false,
        freezeTableName: true,
      }
    );
  
    return Turn;
  };