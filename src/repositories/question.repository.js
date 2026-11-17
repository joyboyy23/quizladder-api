// The only file that queries questions and answers (choices).
const { sequelize, QuestionSet, Question, Answer } = require('../models');

const WITH_ANSWERS = [
  { model: Answer, as: 'answers', separate: true, order: [['choice_index', 'ASC']] },
];

function findPageBySet(setId, { limit, offset }) {
  return Question.findAndCountAll({
    where: { question_set_id: setId },
    include: WITH_ANSWERS,
    order: [['position', 'ASC'], ['question_id', 'ASC']],
    limit,
    offset,
  });
}

function findInSet(setId, questionId, options = {}) {
  return Question.findOne({
    where: { question_id: questionId, question_set_id: setId },
    include: WITH_ANSWERS,
    ...options,
  });
}

function countBySet(setId) {
  return Question.count({ where: { question_set_id: setId } });
}

function toAnswerRows(questionId, choices) {
  return choices.map((choice, index) => ({
    question_id: questionId,
    choice_index: index + 1,
    answer_text: choice.text,
    is_correct: choice.is_correct,
  }));
}

function createWithAnswers(setId, text, choices, maxQuestions) {
  return sequelize.transaction(async (transaction) => {
    await QuestionSet.findByPk(setId, { transaction, lock: transaction.LOCK.UPDATE });
    const count = await Question.count({ where: { question_set_id: setId }, transaction });
    if (count >= maxQuestions) return { limitReached: true };

    const highest = await Question.max('position', { where: { question_set_id: setId }, transaction });
    const question = await Question.create(
      { question_set_id: setId, question_text: text, position: (Number(highest) || 0) + 1 },
      { transaction }
    );
    await Answer.bulkCreate(toAnswerRows(question.question_id, choices), { transaction });
    return {
      limitReached: false,
      question: await findInSet(setId, question.question_id, { transaction }),
    };
  });
}

function updateWithAnswers(question, changes) {
  return sequelize.transaction(async (transaction) => {
    if (changes.text !== undefined) {
      await question.update({ question_text: changes.text }, { transaction });
    }
    if (changes.choices !== undefined) {
      await Answer.destroy({ where: { question_id: question.question_id }, transaction });
      await Answer.bulkCreate(toAnswerRows(question.question_id, changes.choices), { transaction });
    }
    return findInSet(question.question_set_id, question.question_id, { transaction });
  });
}

function removeWithAnswers(question) {
  return sequelize.transaction(async (transaction) => {
    await Answer.destroy({ where: { question_id: question.question_id }, transaction });
    await question.destroy({ transaction });
  });
}

module.exports = {
  findPageBySet, findInSet, countBySet, createWithAnswers, updateWithAnswers, removeWithAnswers,
};
