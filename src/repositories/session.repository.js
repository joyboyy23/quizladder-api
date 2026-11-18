// The only file that queries game_sessions.
const { sequelize, GameSession } = require('../models');

function findByCode(code, options = {}) {
  return GameSession.findOne({ where: { join_code: code }, ...options });
}

function lockByCode(code, transaction) {
  return GameSession.findOne({
    where: { join_code: code },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

function create(data) {
  return GameSession.create(data);
}

function update(session, changes, options = {}) {
  return session.update(changes, options);
}

function transaction(callback, options = {}) {
  return sequelize.transaction(options, callback);
}

function countByQuestionSet(questionSetId) {
  return GameSession.count({ where: { question_set_id: questionSetId } });
}

module.exports = { findByCode, lockByCode, create, update, transaction, countByQuestionSet };
