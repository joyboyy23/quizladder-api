const { body, param, query } = require('express-validator');
const { pageRules, sortRules } = require('./list.validator');

const idParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('id must be a positive whole number')
    .bail()
    .toInt(),
];

function name(required) {
  const chain = body('name');
  if (required) {
    chain.exists().withMessage('name is required').bail();
  } else {
    chain.optional();
  }
  return chain
    .isString().withMessage('name must be text')
    .bail()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('name must be 3 to 100 characters long');
}

const createRules = [name(true)];
const updateRules = [...idParam, name(false)];

const listRules = [
  ...pageRules,
  ...sortRules(['id', 'name', 'created_at']),
  query('q')
    .optional()
    .isString().withMessage('q must be text')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('q must be 1 to 100 characters long'),
];

const readRules = [
  ...idParam,
  query('include').optional().isIn(['questions']).withMessage('include must be: questions'),
];

module.exports = { idParam, createRules, updateRules, listRules, readRules };
