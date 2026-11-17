// The only file that queries question_sets.
const { Op } = require('sequelize');
const { sequelize, QuestionSet, Question, Answer } = require('../models');

const SORT_COLUMNS = { id: 'question_set_id', name: 'name', created_at: 'created_at' };

function escapeLike(text) {
  return text.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function findPage({ q, sort = 'id', order = 'asc', limit, offset }) {
  const where = q ? { name: { [Op.iLike]: `%${escapeLike(q)}%` } } : {};
  const direction = order === 'desc' ? 'DESC' : 'ASC';

  return QuestionSet.findAndCountAll({
    where,
    order: [[SORT_COLUMNS[sort] || 'question_set_id', direction], ['question_set_id', 'ASC']],
    limit,
    offset,
  });
}

function findById(id) {
  return QuestionSet.findByPk(id);
}

function findByIdWithQuestions(id) {
  return QuestionSet.findByPk(id, {
    include: [{ model: Question, as: 'questions', include: [{ model: Answer, as: 'answers' }] }],
    order: [
      [{ model: Question, as: 'questions' }, 'position', 'ASC'],
      [{ model: Question, as: 'questions' }, 'question_id', 'ASC'],
      [{ model: Question, as: 'questions' }, { model: Answer, as: 'answers' }, 'choice_index', 'ASC'],
    ],
  });
}

function create(data) {
  return QuestionSet.create(data);
}

function update(questionSet, changes) {
  return questionSet.update(changes);
}

function removeWithContent(questionSet) {
  return sequelize.transaction(async (transaction) => {
    const questions = await Question.findAll({
      attributes: ['question_id'],
      where: { question_set_id: questionSet.question_set_id },
      transaction,
    });
    const ids = questions.map((question) => question.question_id);
    if (ids.length > 0) {
      await Answer.destroy({ where: { question_id: ids }, transaction });
      await Question.destroy({ where: { question_id: ids }, transaction });
    }
    await questionSet.destroy({ transaction });
  });
}

module.exports = { findPage, findById, findByIdWithQuestions, create, update, removeWithContent };
