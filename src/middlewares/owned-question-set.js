const { matchedData } = require('express-validator');
const questionSetService = require('../services/question-set.service');

async function ownedQuestionSet(req, res, next) {
  const { id } = matchedData(req, { locations: ['params'] });
  req.questionSet = await questionSetService.getOwned(id, req.user);
  next();
}

module.exports = ownedQuestionSet;
