// Rules for the questions of a set. No req, no res, no queries of its own.
const questionRepository = require('../repositories/question.repository');
const questionSetService = require('./question-set.service');
const { toOffset } = require('../utils/paginate');
const { notFound, conflict } = require('../errors/app-error');

const MAX_QUESTIONS = 100;

function cleanChoices(choices) {
  return choices.map((choice) => ({ text: choice.text, is_correct: choice.is_correct }));
}

async function findOrFail(setId, questionId) {
  const question = await questionRepository.findInSet(setId, questionId);
  if (!question) {
    throw notFound('QUESTION_NOT_FOUND', `Question set ${setId} has no question ${questionId}.`);
  }
  return question;
}

async function list(setId, { page = 1, limit = 10 }) {
  await questionSetService.get(setId);
  const result = await questionRepository.findPageBySet(setId, toOffset({ page, limit }));
  return { rows: result.rows, count: result.count, page, limit };
}

async function create(setId, data, actor) {
  const questionSet = await questionSetService.getEditable(setId, actor);
  const result = await questionRepository.createWithAnswers(
    questionSet.question_set_id,
    data.text,
    cleanChoices(data.choices),
    MAX_QUESTIONS
  );
  if (result.limitReached) {
    throw conflict('QUESTION_LIMIT_REACHED', `A question set holds at most ${MAX_QUESTIONS} questions.`);
  }
  return result.question;
}

async function update(setId, questionId, changes, actor) {
  await questionSetService.getEditable(setId, actor);
  const question = await findOrFail(setId, questionId);
  return questionRepository.updateWithAnswers(question, {
    text: changes.text,
    choices: changes.choices ? cleanChoices(changes.choices) : undefined,
  });
}

async function remove(setId, questionId, actor) {
  await questionSetService.getEditable(setId, actor);
  const question = await findOrFail(setId, questionId);
  await questionRepository.removeWithAnswers(question);
}

module.exports = { list, create, update, remove };
