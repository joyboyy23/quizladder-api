// Rules for question sets. No req, no res, no queries of its own.
const questionSetRepository = require('../repositories/question-set.repository');
const { notFound } = require('../errors/app-error');

async function findOrFail(id) {
  const questionSet = await questionSetRepository.findById(id);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `No question set has the id ${id}.`);
  }
  return questionSet;
}

function list() {
  return questionSetRepository.findAll();
}

function create(data) {
  return questionSetRepository.create({ name: data.name });
}

function get(id) {
  return findOrFail(id);
}

async function update(id, changes) {
  const questionSet = await findOrFail(id);
  const next = {};
  if (changes.name !== undefined) next.name = changes.name;
  return questionSetRepository.update(questionSet, next);
}

async function remove(id) {
  const questionSet = await findOrFail(id);
  await questionSetRepository.remove(questionSet);
}

module.exports = { list, create, get, update, remove };
