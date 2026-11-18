const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const sessionController = require('../controllers/session.controller');
const playerController = require('../controllers/player.controller');
const gameplayController = require('../controllers/gameplay.controller');
const rules = require('../validators/session.validator');
const gameplayRules = require('../validators/gameplay.validator');

const router = Router();

router.post('/', requireUser('HOST', 'ADMIN'),
  rules.createRules, validate, sessionController.create);
router.get('/:code', rules.codeParam, validate, sessionController.get);
router.patch('/:code', requireUser('HOST', 'ADMIN'),
  rules.statusRules, validate, sessionController.changeStatus);

router.get('/:code/state', rules.codeParam, validate, gameplayController.getState);
router.post('/:code/roll', requireUser(),
  gameplayRules.rollRules, validate, gameplayController.roll);
router.get('/:code/question', requireUser(),
  rules.codeParam, validate, gameplayController.getQuestion);
router.post('/:code/answers', requireUser(),
  gameplayRules.answerRules, validate, gameplayController.answer);
router.post('/:code/punish', requireUser(),
  gameplayRules.punishRules, validate, gameplayController.punish);
router.get('/:code/leaderboard',
  gameplayRules.leaderboardRules, validate, gameplayController.leaderboard);

// Players are part of a session, so their URLs sit under it.
router.post('/:code/players', requireUser(),
  rules.joinRules, validate, playerController.join);
router.get('/:code/players', rules.codeParam, validate, playerController.list);

module.exports = router;
