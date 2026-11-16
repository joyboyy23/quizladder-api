const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const controller = require('../controllers/user.controller');
const rules = require('../validators/auth.validator');
const router = Router();
// Account management is for admins only.
router.use(requireUser('ADMIN'));
router.get('/', controller.list);
router.patch('/:id/role', rules.roleRules, validate, controller.changeRole);
module.exports = router;