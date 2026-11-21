// Small helpers shared by the HTTP tests.
const { randomInt } = require('crypto');
const request = require('supertest');
const app = require('../../src/app');

// The demo password of the seeders (db/seeders/20261115015640-demo-passwords.js).
const DEMO_PASSWORD = 'quizladder';
// The password of the accounts that the tests register themselves.
const NEW_PASSWORD = 'Libro-2026';

async function login(schoolId, password = DEMO_PASSWORD) {
  const res = await request(app).post('/api/v1/auth/login').send({ school_id: schoolId, password });
  if (res.status !== 200) throw new Error(`login of ${schoolId} answered ${res.status}`);
  return res.body;
}

// Logs in a seeded account and returns its "Authorization" header value.
async function bearer(schoolId) {
  const body = await login(schoolId);
  return `Bearer ${body.token}`;
}

// A school ID that matches the validator (4 digits, a dash, 5 digits) and is new every time.
function uniqueSchoolId() {
  return `${randomInt(1000, 10000)}-${randomInt(10000, 100000)}`;
}

// Registers a brand-new PLAYER through the API and logs it in.
async function registerPlayer() {
  const schoolId = uniqueSchoolId();
  const res = await request(app).post('/api/v1/auth/register').send({
    school_id: schoolId,
    full_name: 'Test Player',
    email: `${schoolId}@sorsu.edu.ph`,
    password: NEW_PASSWORD,
  });
  if (res.status !== 201) throw new Error(`register of ${schoolId} answered ${res.status}`);
  const body = await login(schoolId, NEW_PASSWORD);
  return { school_id: schoolId, user_id: res.body.user.user_id, auth: `Bearer ${body.token}` };
}

module.exports = { app, request, bearer, login, registerPlayer, uniqueSchoolId, DEMO_PASSWORD, NEW_PASSWORD };
