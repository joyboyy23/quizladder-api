const { body, param } = require('express-validator');

const codeParam = [
  param('code')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('the join code must be six digits'),
];

const createRules = [
  body('question_set_id')
    .exists().withMessage('question_set_id is required')
    .bail()
    .isInt({ min: 1 }).withMessage('question_set_id must be a positive whole number')
    .bail()
    .toInt(),
];

const statusRules = [
  ...codeParam,
  body('status')
    .exists().withMessage('status is required')
    .bail()
    .isIn(['PLAYING', 'FINISHED'])
    .withMessage('status must be PLAYING or FINISHED'),
];

const joinRules = [
  ...codeParam,
  body('nickname')
    .exists().withMessage('nickname is required')
    .bail()
    .isString().withMessage('nickname must be text')
    .bail()
    .trim()
    .isLength({ min: 2, max: 24 })
    .withMessage('nickname must be 2 to 24 characters long'),
  body('avatar_color')
    .exists().withMessage('avatar_color is required')
    .bail()
    .isIn(['RED', 'BLUE', 'GREEN', 'YELLOW'])
    .withMessage('avatar_color must be RED, BLUE, GREEN or YELLOW'),
];

module.exports = { codeParam, createRules, statusRules, joinRules };
