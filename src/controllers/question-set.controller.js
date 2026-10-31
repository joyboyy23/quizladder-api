// Reads the validated input, calls one service function, and chooses the status.
const { matchedData } = require('express-validator');
const questionSetService = require('../services/question-set.service');

function toJson(questionSet) {
  return {
    id: Number(questionSet.question_set_id),
    name: questionSet.name,
    created_at: questionSet.created_at,
  };
}

async function list(req, res) {
  const questionSets = await questionSetService.list();
  res.status(200).json(questionSets.map(toJson));
}

async function create(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const questionSet = await questionSetService.create(data);
  res.status(201).json(toJson(questionSet));
}

async function get(req, res) {
  const { id } = matchedData(req);
  const questionSet = await questionSetService.get(id);
  res.status(200).json(toJson(questionSet));
}

async function update(req, res) {
  const { id, ...changes } = matchedData(req);
  const questionSet = await questionSetService.update(id, changes);
  res.status(200).json(toJson(questionSet));
}

async function remove(req, res) {
  const { id } = matchedData(req);
  await questionSetService.remove(id);
  res.status(204).end();
}

module.exports = { list, create, get, update, remove };
