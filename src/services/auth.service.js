// Rules for accounts and login. No req, no res, no queries of its own.
const userRepository = require('../repositories/user.repository');
const password = require('../security/password');
const token = require('../security/token');
const env = require('../config/env');
const { unauthorized } = require('../errors/app-error');
// A new account is ALWAYS a PLAYER. Admins promote hosts later.
async function register(data) {
const passwordHash = await password.hash(data.password);
return userRepository.create({
school_id: data.school_id,
full_name: data.full_name,
email: data.email,
role: 'PLAYER',
password_hash: passwordHash,
});
}
// An unknown school ID and a wrong password must look exactly the same.
async function login({ school_id: schoolId, password: plain }) {
const user = await userRepository.findForLogin(schoolId);
const ok = await password.matches(plain, user ? user.password_hash : null);
if (!ok) {
throw unauthorized('School ID or password is incorrect.', 'INVALID_CREDENTIALS');
}
return {
token: token.issue(user),
token_type: 'Bearer',
expires_in: env.jwt.expiresIn,
user,
};
}
module.exports = { register, login };