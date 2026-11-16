const { matchedData } = require('express-validator');
const userService = require('../services/user.service');
const { userToJson } = require('./auth.controller');
async function list(req, res) {
const users = await userService.list();
res.status(200).json(users.map(userToJson));
}
async function changeRole(req, res) {
const { id, role } = matchedData(req);
const user = await userService.changeRole(id, role, req.user);
res.status(200).json(userToJson(user));
}
module.exports = { list, changeRole };