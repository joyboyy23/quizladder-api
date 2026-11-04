// Reads the validated input, calls one service function, and chooses the status.
const { matchedData } = require('express-validator');
const sessionService = require('../services/session.service');

function sessionToJson(session) {
  return {
    code: session.join_code,
    status: session.status,
    question_set_id: Number(session.question_set_id),
    host_id: Number(session.host_id),
    started_at: session.started_at,
    finished_at: session.finished_at,
  };
}

async function create(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const session = await sessionService.create(data);
  res.status(201).json(sessionToJson(session));
}

async function get(req, res) {
  const { code } = matchedData(req);
  const session = await sessionService.get(code);
  res.status(200).json(sessionToJson(session));
}

async function changeStatus(req, res) {
  const { code, status } = matchedData(req);
  const session = await sessionService.changeStatus(code, status);
  res.status(200).json(sessionToJson(session));
}

module.exports = { create, get, changeStatus, sessionToJson };
