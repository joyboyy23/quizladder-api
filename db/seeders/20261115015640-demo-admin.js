'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
async up(queryInterface) {
await queryInterface.bulkInsert('users', [
{
school_id: 'ADM-0001',
full_name: 'Library Admin',
email: 'library.admin@sorsu.edu.ph',
role: 'ADMIN',
},
]);
},
async down(queryInterface) {
await queryInterface.bulkDelete('users', { school_id: 'ADM-0001' }, {});
},
};