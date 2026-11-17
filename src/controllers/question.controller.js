// Reads the validated input, calls one service function, and chooses the status.
const { matchedData } = require('express-validator');
const questionService = require('../services/question.service');
const { envelope } = require('../utils/paginate');

function choiceToJson(answer) {
  return {
    choice_index: answer.choice_index,
    text: answer.answer_text,
    is_correct: answer.is_correct,
  };
}

function questionToJson(question) {
  return {
    id: Number(question.question_id),
    position: question.position,
    text: question.question_text,
    choices: (question.answers || []).map(choiceToJson),
  };
}

async function list(req, res) {
  const { id, ...paging } = matchedData(req);
  const result = await questionService.list(id, paging);
  res.status(200).json(
    envelope(result.rows.map(questionToJson), result.count, { page: result.page, limit: result.limit })
  );
}

async function create(req, res) {
  const { id, text, choices } = matchedData(req, { locations: ['params', 'body'] });
  const question = await questionService.create(id, { text, choices }, req.user);
  res.status(201).json(questionToJson(question));
}

async function update(req, res) {
  const { id, questionId, ...changes } = matchedData(req, { locations: ['params', 'body'] });
  const question = await questionService.update(id, questionId, changes, req.user);
  res.status(200).json(questionToJson(question));
}

async function remove(req, res) {
  const { id, questionId } = matchedData(req);
  await questionService.remove(id, questionId, req.user);
  res.status(204).end();
}

module.exports = { list, create, update, remove, questionToJson };
