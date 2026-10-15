module.exports = (sequelize, DataTypes) => {
    const Question = sequelize.define(
      'Question',
      {
        question_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
  
        question_set_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
  
        question_text: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        tableName: 'questions',
        timestamps: false,
        freezeTableName: true,
      }
    );
  
    return Question;
  };