module.exports = (sequelize, DataTypes) => {
    const Tile = sequelize.define(
      'Tile',
      {
        tile_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
  
        board_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
  
        tile_number: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
            max: 100,
          },
        },
  
        tile_type: {
          type: DataTypes.STRING(20),
          allowNull: false,
          validate: {
            isIn: [['NORMAL', 'EVENT', 'SNAKE', 'LADDER']],
          },
        },
  
        destination_tile: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
            max: 100,
          },
        },
      },
      {
        tableName: 'tiles',
        timestamps: false,
        freezeTableName: true,
      }
    );
  
    return Tile;
  };