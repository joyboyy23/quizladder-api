module.exports = (sequelize, DataTypes) => {
    const Player = sequelize.define(
      'Player',
      {
        player_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
  
        session_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
  
        user_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
  
        nickname: {
          type: DataTypes.STRING(30),
          allowNull: false,
        },
  
        avatar_color: {
          type: DataTypes.STRING(10),
          allowNull: false,
          validate: {
            isIn: [['RED', 'BLUE', 'GREEN', 'YELLOW']],
          },
        },
  
        position: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: {
            min: 1,
            max: 100,
          },
        },
  
        finish_position: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
            max: 4,
          },
        },
  
        finished_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        joined_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: 'players',
        timestamps: false,
        freezeTableName: true,
        indexes: [
          {
            unique: true,
            fields: ['session_id', 'nickname'],
          },
          {
            unique: true,
            fields: ['session_id', 'avatar_color'],
          },
          {
            unique: true,
            fields: ['session_id', 'user_id'],
          },
        ],
      }
    );
  
    return Player;
  };