// The only file that queries game_sessions.
const { GameSession } = require('../models');

function findByCode(code) {
  return GameSession.findOne({ where: { join_code: code } });
}

function create(data) {
  return GameSession.create(data);
}

function update(session, changes) {
  return session.update(changes);
}

function countByQuestionSet(questionSetId) {
  return GameSession.count({ where: { question_set_id: questionSetId } });
}

module.exports = { findByCode, create, update, countByQuestionSet };
