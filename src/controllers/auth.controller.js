// Reads the validated input, calls one service function, and chooses the status.
const { matchedData } = require('express-validator');
const authService = require('../services/auth.service');
function userToJson(user) {
return {
user_id: Number(user.user_id),
school_id: user.school_id,
full_name: user.full_name,
email: user.email,
role: user.role,
created_at: user.created_at,
};
}
async function register(req, res) {
const data = matchedData(req, { locations: ['body'] });
const user = await authService.register(data);
res.status(201).json({ user: userToJson(user) });
}
async function login(req, res) {
const data = matchedData(req, { locations: ['body'] });
const result = await authService.login(data);
res.status(200).json({
token: result.token,
token_type: result.token_type,
expires_in: result.expires_in,
user: userToJson(result.user),
});
}
function me(req, res) {
res.status(200).json({ user: userToJson(req.account) });
}
module.exports = { register, login, me, userToJson };