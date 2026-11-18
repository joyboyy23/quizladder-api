const { matchedData } = require('express-validator');
const gameplayService = require('../services/gameplay.service');

async function getState(req, res) {
  const { code } = matchedData(req);
  const state = await gameplayService.getState(code);
  res.status(200).json(state);
}

async function roll(req, res) {
  const data = matchedData(req);
  const result = await gameplayService.roll(data.code, req.user.user_id, data);
  res.status(200).json(result);
}

async function getQuestion(req, res) {
  const { code } = matchedData(req);
  const question = await gameplayService.getQuestion(code, req.user.user_id);
  res.status(200).json(question);
}

async function answer(req, res) {
  const { code, choice_index: choiceIndex } = matchedData(req);
  const result = await gameplayService.answer(code, req.user.user_id, choiceIndex);
  res.status(200).json(result);
}

async function punish(req, res) {
  const { code, target_player_id: targetPlayerId, amount } = matchedData(req);
  const result = await gameplayService.punish(
    code,
    req.user.user_id,
    targetPlayerId,
    amount
  );
  res.status(200).json(result);
}

async function leaderboard(req, res) {
  const { code, limit = 10 } = matchedData(req);
  const result = await gameplayService.leaderboard(code, limit);
  res.status(200).json(result);
}

module.exports = { getState, roll, getQuestion, answer, punish, leaderboard };
