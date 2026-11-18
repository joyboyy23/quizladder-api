const { body, query } = require('express-validator');
const { codeParam } = require('./session.validator');

const rollRules = [
  ...codeParam,
  body('dice')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('dice must be a whole number from 1 to 6')
    .bail()
    .toInt(),
  body('event')
    .optional()
    .isIn(['QUESTION', 'PUNISHMENT'])
    .withMessage('event must be QUESTION or PUNISHMENT'),
];

const answerRules = [
  ...codeParam,
  body('choice_index')
    .exists().withMessage('choice_index is required')
    .bail()
    .isInt({ min: 1, max: 4 }).withMessage('choice_index must be from 1 to 4')
    .bail()
    .toInt(),
];

const punishRules = [
  ...codeParam,
  body('target_player_id')
    .exists().withMessage('target_player_id is required')
    .bail()
    .isInt({ min: 1 }).withMessage('target_player_id must be a positive whole number')
    .bail()
    .toInt(),
  body('amount')
    .exists().withMessage('amount is required')
    .bail()
    .isInt({ min: 1, max: 6 }).withMessage('amount must be from 1 to 6')
    .bail()
    .toInt(),
];

const leaderboardRules = [
  ...codeParam,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be from 1 to 100')
    .bail()
    .toInt(),
];

module.exports = { rollRules, answerRules, punishRules, leaderboardRules };
