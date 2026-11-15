'use strict';
const MAP = [['STUDENT', 'PLAYER'], ['FACULTY', 'HOST'], ['STAFF', 'ADMIN']];
async function swapRoles(queryInterface, pairs, allowed, defaultRole) {
const db = queryInterface.sequelize;
await queryInterface.removeConstraint('users', 'users_role_check');
for (const [from, to] of pairs) {
await db.query('UPDATE users SET role = :to WHERE role = :from', {
replacements: { from, to },
});
}
await queryInterface.addConstraint('users', {
fields: ['role'],
type: 'check',
name: 'users_role_check',
where: { role: allowed },
});
await db.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT '${defaultRole}'`);
}
/** @type {import('sequelize-cli').Migration} */
module.exports = {
async up(queryInterface) {
await swapRoles(queryInterface, MAP, ['PLAYER', 'HOST', 'ADMIN'], 'PLAYER');
},
async down(queryInterface) {
await swapRoles(
queryInterface,
MAP.map(([from, to]) => [to, from]),
['STUDENT', 'FACULTY', 'STAFF'],
'STUDENT'
);
},
};