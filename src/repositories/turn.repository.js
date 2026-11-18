const { Op } = require('sequelize');
const { Turn } = require('../models');

function create(data, transaction) {
  return Turn.create(data, { transaction });
}

function update(turn, changes, transaction) {
  return turn.update(changes, { transaction });
}

function findOpenBySession(sessionId, transaction) {
  return Turn.findOne({
    where: { session_id: sessionId, ended_at: null },
    order: [['turn_number', 'DESC']],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

function closeOpenBySession(sessionId, endedAt, transaction) {
  return Turn.update(
    { ended_at: endedAt },
    { where: { session_id: sessionId, ended_at: null }, transaction }
  );
}

async function findAskedQuestionIds(sessionId, transaction) {
  const turns = await Turn.findAll({
    attributes: ['question_id'],
    where: {
      session_id: sessionId,
      question_id: { [Op.ne]: null },
    },
    raw: true,
    transaction,
  });
  return turns.map((turn) => turn.question_id);
}

module.exports = {
  create,
  update,
  findOpenBySession,
  closeOpenBySession,
  findAskedQuestionIds,
};
