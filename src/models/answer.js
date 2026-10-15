module.exports = (sequelize, DataTypes) => {
    const Answer = sequelize.define(
      'Answer',
      {
        answer_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
  
        question_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
  
        choice_index: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
            max: 4,
          },
        },
  
        answer_text: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
  
        is_correct: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        tableName: 'answers',
        timestamps: false,
        freezeTableName: true,
      }
    );
  
    return Answer;
  };