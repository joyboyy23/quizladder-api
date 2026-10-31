const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const controller = require('../controllers/question-set.controller');
const rules = require('../validators/question-set.validator');

const router = Router();

// Faculty and staff share every question set. Students cannot manage them.
router.use(requireUser('FACULTY', 'STAFF'));

router.get('/', controller.list);
router.post('/', rules.createRules, validate, controller.create);
router.get('/:id', rules.idParam, validate, controller.get);
router.patch('/:id', rules.updateRules, validate, controller.update);
router.delete('/:id', rules.idParam, validate, controller.remove);

module.exports = router;
