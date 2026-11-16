// Rules for managing accounts (admins only). No req, no res.
const userRepository = require('../repositories/user.repository');
const { notFound, conflict } = require('../errors/app-error');
function list() {
return userRepository.findAll();
}
async function changeRole(id, role, actor) {
const user = await userRepository.findById(id);
if (!user) {
throw notFound('USER_NOT_FOUND', `No account has the id ${id}.`);
}
if (Number(user.user_id) === Number(actor.user_id)) {
throw conflict('CANNOT_CHANGE_OWN_ROLE', 'You cannot change your own role.');
}
return userRepository.update(user, { role });
}
module.exports = { list, changeRole };