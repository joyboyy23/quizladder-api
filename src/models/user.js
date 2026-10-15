module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
      'User',
      {
        user_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
  
        school_id: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true,
        },
  
        full_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
  
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
  
        role: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'STUDENT',
          validate: {
            isIn: [['STUDENT', 'FACULTY', 'STAFF']],
          },
        },
  
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: 'users',
        timestamps: false,
        freezeTableName: true,
      }
    );
  
    return User;
  };
