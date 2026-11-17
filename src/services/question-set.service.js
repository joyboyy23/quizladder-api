// Rules for question sets. No req, no res, no queries of its own.
const questionSetRepository = require('../repositories/question-set.repository');
const sessionRepository = require('../repositories/session.repository');
const coverFiles = require('../lib/cover-files');
const { toOffset } = require('../utils/paginate');
const { notFound, forbidden, conflict } = require('../errors/app-error');

async function findOrFail(id) {
  const questionSet = await questionSetRepository.findById(id);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `No question set has the id ${id}.`);
  }
  return questionSet;
}

function assertCanModify(questionSet, actor) {
  const isOwner = questionSet.owner_id !== null
    && String(questionSet.owner_id) === String(actor.user_id);
  if (actor.role === 'ADMIN' || isOwner) return;
  throw forbidden('This question set belongs to another host.');
}

async function assertNotUsed(questionSet) {
  const games = await sessionRepository.countByQuestionSet(questionSet.question_set_id);
  if (games > 0) {
    throw conflict(
      'QUESTION_SET_IN_USE',
      'This question set was used in a game, so its questions can no longer change.'
    );
  }
}

async function list(query) {
  const { page = 1, limit = 10 } = query;
  const result = await questionSetRepository.findPage({ ...query, ...toOffset({ page, limit }) });
  return { rows: result.rows, count: result.count, page, limit };
}

async function get(id, include) {
  if (include === 'questions') {
    const questionSet = await questionSetRepository.findByIdWithQuestions(id);
    if (!questionSet) {
      throw notFound('QUESTION_SET_NOT_FOUND', `No question set has the id ${id}.`);
    }
    return questionSet;
  }
  return findOrFail(id);
}

async function getOwned(id, actor) {
  const questionSet = await findOrFail(id);
  assertCanModify(questionSet, actor);
  return questionSet;
}

async function getEditable(id, actor) {
  const questionSet = await getOwned(id, actor);
  await assertNotUsed(questionSet);
  return questionSet;
}

function create(data, actor) {
  return questionSetRepository.create({ name: data.name, owner_id: actor.user_id });
}

async function update(id, changes, actor) {
  const questionSet = await getOwned(id, actor);
  const next = {};
  if (changes.name !== undefined) next.name = changes.name;
  return questionSetRepository.update(questionSet, next);
}

async function remove(id, actor) {
  const questionSet = await getEditable(id, actor);
  await questionSetRepository.removeWithContent(questionSet);
  await coverFiles.removeCover(questionSet.cover_picture);
}

async function setCover(id, filename, actor) {
  const questionSet = await getOwned(id, actor);
  return questionSetRepository.update(questionSet, { cover_picture: filename });
}

module.exports = {
  list, get, getOwned, getEditable, create, update, remove, setCover,
};
