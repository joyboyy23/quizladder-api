module.exports = (sequelize, DataTypes) => {
    const Board = sequelize.define(
      'Board',
      {
        board_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
  
        size: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 100,
          validate: {
            isIn: [[100]],
          },
        },
      },
      {
        tableName: 'boards',
        timestamps: false,
        freezeTableName: true,
      }
    );
  
    return Board;
  };