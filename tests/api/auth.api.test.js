// HTTP tests with supertest: authentication flows through the whole app and test database.
const { app, request, registerPlayer, uniqueSchoolId, NEW_PASSWORD } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

test('register 201 gives PLAYER and no password text', async () => {
  const player = await registerPlayer();
  expect(player.auth).toMatch(/^Bearer /);
  const schoolId = player.school_id;
  const res = await request(app).post('/api/v1/auth/register').send({
    school_id: schoolId, full_name: 'Duplicate', email: `${schoolId}-2@sorsu.edu.ph`,
    password: NEW_PASSWORD, role: 'ADMIN',
  });
  expect([409, 400]).toContain(res.status);
  const fresh = uniqueSchoolId();
  const created = await request(app).post('/api/v1/auth/register').send({
    school_id: fresh, full_name: 'Fresh', email: `${fresh}@sorsu.edu.ph`,
    password: NEW_PASSWORD, role: 'ADMIN',
  });
  expect(created.status).toBe(201);
  expect(created.body.user.role).toBe('PLAYER');
  expect(JSON.stringify(created.body)).not.toContain('password');
});

test('duplicate school_id 409 SCHOOL_ID_TAKEN', async () => {
  const player = await registerPlayer();
  const res = await request(app).post('/api/v1/auth/register').send({
    school_id: player.school_id, full_name: 'Duplicate', email: `${uniqueSchoolId()}@sorsu.edu.ph`, password: NEW_PASSWORD,
  });
  expect(res.status).toBe(409);
  expect(res.body.error.code).toBe('SCHOOL_ID_TAKEN');
});

test('duplicate email 409 EMAIL_TAKEN', async () => {
  const player = await registerPlayer();
  const email = `${player.school_id}@sorsu.edu.ph`;
  const res = await request(app).post('/api/v1/auth/register').send({
    school_id: uniqueSchoolId(), full_name: 'Duplicate', email, password: NEW_PASSWORD,
  });
  expect(res.status).toBe(409);
  expect(res.body.error.code).toBe('EMAIL_TAKEN');
});

test('password abc 400 names password', async () => {
  const res = await request(app).post('/api/v1/auth/register').send({
    school_id: uniqueSchoolId(), full_name: 'Weak', email: `${uniqueSchoolId()}@sorsu.edu.ph`, password: 'abc',
  });
  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe('VALIDATION_FAILED');
  expect(JSON.stringify(res.body.error.details)).toContain('password');
});

test('bad school_id 400', async () => {
  const res = await request(app).post('/api/v1/auth/register').send({
    school_id: '12345', full_name: 'Bad', email: `${uniqueSchoolId()}@sorsu.edu.ph`, password: NEW_PASSWORD,
  });
  expect(res.status).toBe(400);
});

test('login 200 returns a 3-part Bearer token without password_hash', async () => {
  const player = await registerPlayer();
  const res = await request(app).post('/api/v1/auth/login').send({ school_id: player.school_id, password: NEW_PASSWORD });
  expect(res.status).toBe(200);
  expect(res.body.token.split('.')).toHaveLength(3);
  expect(res.body.token_type).toBe('Bearer');
  expect(res.body).not.toHaveProperty('password_hash');
});

test('wrong password and unknown school return exactly the same body', async () => {
  const wrong = await request(app).post('/api/v1/auth/login').send({ school_id: '2023-00123', password: 'wrong' });
  const unknown = await request(app).post('/api/v1/auth/login').send({ school_id: '9999-99999', password: 'wrong' });
  expect(wrong.status).toBe(401);
  expect(unknown.status).toBe(401);
  expect(wrong.body).toEqual(unknown.body);
  expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
});

test('login {} 400', async () => {
  const res = await request(app).post('/api/v1/auth/login').send({});
  expect(res.status).toBe(400);
});

test('GET /auth/me token and invalid token behavior', async () => {
  const player = await registerPlayer();
  const good = await request(app).get('/api/v1/auth/me').set('Authorization', player.auth);
  expect(good.status).toBe(200);
  for (const headers of [{}, { Authorization: 'Bearer changed.token.value' }, { Authorization: 'Token abc' }, { 'X-Demo-User': '2023-00123' }]) {
    const res = await request(app).get('/api/v1/auth/me').set(headers);
    expect(res.status).toBe(401);
  }
  const missing = await request(app).get('/api/v1/auth/me');
  expect(missing.body.error.code).toBe('AUTH_REQUIRED');
  const changed = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer changed.token.value');
  expect(changed.body.error.code).toBe('INVALID_TOKEN');
  const tokenHeader = await request(app).get('/api/v1/auth/me').set('Authorization', 'Token abc');
  expect(tokenHeader.body.error.code).toBe('INVALID_TOKEN');
});
