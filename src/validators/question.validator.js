const { body, param } = require('express-validator');
const { pageRules } = require('./list.validator');

const setIdParam = param('id')
  .isInt({ min: 1 }).withMessage('id must be a positive whole number')
  .bail()
  .toInt();

const questionIdParam = param('questionId')
  .isInt({ min: 1 }).withMessage('questionId must be a positive whole number')
  .bail()
  .toInt();

function text(required) {
  const chain = body('text');
  if (required) {
    chain.exists().withMessage('text is required').bail();
  } else {
    chain.optional();
  }
  return chain
    .isString().withMessage('text must be text')
    .bail()
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage('text must be 5 to 300 characters long');
}

function choices(required) {
  const chain = body('choices');
  if (required) {
    chain.exists().withMessage('choices is required').bail();
  } else {
    chain.optional();
  }
  return chain
    .isArray({ min: 4, max: 4 }).withMessage('choices must be a list of exactly 4 choices')
    .bail()
    .custom((list) => list.filter((choice) => choice && choice.is_correct === true).length === 1)
    .withMessage('exactly one choice must have is_correct true');
}

const choiceRules = [
  body('choices.*.text')
    .if(body('choices').isArray())
    .isString().withMessage('each choice needs text')
    .bail()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('each choice text must be 1 to 120 characters long'),
  body('choices.*.is_correct')
    .if(body('choices').isArray())
    .isBoolean({ strict: true }).withMessage('is_correct must be true or false'),
];

const listRules = [setIdParam, ...pageRules];
const idRules = [setIdParam, questionIdParam];
const createRules = [setIdParam, text(true), choices(true), ...choiceRules];
const updateRules = [
  setIdParam,
  questionIdParam,
  text(false),
  choices(false),
  ...choiceRules,
  body()
    .custom((value) => Boolean(value) && (value.text !== undefined || value.choices !== undefined))
    .withMessage('send text, choices, or both'),
];

module.exports = { listRules, idRules, createRules, updateRules };
