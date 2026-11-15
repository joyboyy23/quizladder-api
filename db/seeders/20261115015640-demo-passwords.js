'use strict';
const bcrypt = require('bcryptjs');
const DEMO_PASSWORD = 'quizladder'; // replace with your own
/** @type {import('sequelize-cli').Migration} */
module.exports = {
async up(queryInterface) {
const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
// Only accounts that have no password yet: safe to re-run.
await queryInterface.bulkUpdate('users', { password_hash: hash }, { password_hash: null });
},
async down(queryInterface) {
await queryInterface.bulkUpdate('users', { password_hash: null }, {});
},
};