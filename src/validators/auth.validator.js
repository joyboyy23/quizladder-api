const { body, param } = require('express-validator');
const ROLES = ['PLAYER', 'HOST', 'ADMIN'];
const registerRules = [
body('school_id')
.exists().withMessage('school_id is required')
.bail()
.isString().withMessage('school_id must be text')
.bail()
.trim()
.matches(/^[A-Z0-9]{3,6}-[0-9]{3,5}$/)
.withMessage('school_id must look like 2023-00123 or FAC-0042'),
body('full_name')
.exists().withMessage('full_name is required')
.bail()
.isString().withMessage('full_name must be text')
.bail()
.trim()
.isLength({ min: 2, max: 100 })
.withMessage('full_name must be 2 to 100 characters long'),
body('email')
.exists().withMessage('email is required')
.bail()
.isString().withMessage('email must be text')
.bail()
.trim()
.isEmail().withMessage('email must be a valid email address')
.bail()
.isLength({ max: 255 }).withMessage('email must be at most 255 characters long')
.toLowerCase(),
body('password')
.exists().withMessage('password is required')
.bail()
.isString().withMessage('password must be text')
.bail()
.isLength({ min: 8, max: 72 }).withMessage('password must be 8 to 72 characters long')
.bail()
.custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
.withMessage('password must be at most 72 bytes')
.bail()
.matches(/[A-Za-z]/).withMessage('password must contain a letter')
.bail()
.matches(/[0-9]/).withMessage('password must contain a number'),
];
// Login only checks that the fields exist and are text.
const loginRules = [
body('school_id')
.exists().withMessage('school_id is required')
.bail()
.isString().withMessage('school_id must be text')
.bail()
.trim(),
body('password')
.exists().withMessage('password is required')
.bail()
.isString().withMessage('password must be text'),
];
const roleRules = [
param('id')
.isInt({ min: 1 }).withMessage('id must be a positive whole number')
.bail()
.toInt(),
body('role')
.exists().withMessage('role is required')
.bail()
.isIn(ROLES).withMessage(`role must be one of: ${ROLES.join(', ')}`),
];
module.exports = { registerRules, loginRules, roleRules };