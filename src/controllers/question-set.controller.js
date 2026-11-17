// Reads the validated input, calls one service function, and chooses the status.
const { matchedData } = require('express-validator');
const questionSetService = require('../services/question-set.service');
const { envelope } = require('../utils/paginate');
const { coverUrl, removeCover } = require('../lib/cover-files');
const { questionToJson } = require('./question.controller');

function toJson(questionSet) {
  const json = {
    id: Number(questionSet.question_set_id),
    name: questionSet.name,
    owner_id: questionSet.owner_id === null ? null : Number(questionSet.owner_id),
    cover_url: coverUrl(questionSet.cover_picture),
    created_at: questionSet.created_at,
  };
  if (questionSet.questions) json.questions = questionSet.questions.map(questionToJson);
  return json;
}

async function list(req, res) {
  const query = matchedData(req, { locations: ['query'] });
  const result = await questionSetService.list(query);
  res.status(200).json(
    envelope(result.rows.map(toJson), result.count, { page: result.page, limit: result.limit })
  );
}

async function create(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const questionSet = await questionSetService.create(data, req.user);
  res.status(201).json(toJson(questionSet));
}

async function get(req, res) {
  const { id, include } = matchedData(req);
  const questionSet = await questionSetService.get(id, include);
  res.status(200).json(toJson(questionSet));
}

async function update(req, res) {
  const { id, ...changes } = matchedData(req);
  const questionSet = await questionSetService.update(id, changes, req.user);
  res.status(200).json(toJson(questionSet));
}

async function remove(req, res) {
  const { id } = matchedData(req);
  await questionSetService.remove(id, req.user);
  res.status(204).end();
}

async function uploadCover(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  let questionSet;
  try {
    questionSet = await questionSetService.setCover(id, req.file.filename, req.user);
  } catch (error) {
    await removeCover(req.file.filename);
    throw error;
  }
  await removeCover(req.questionSet.cover_picture);
  res.status(200).json(toJson(questionSet));
}

module.exports = { list, create, get, update, remove, uploadCover };
