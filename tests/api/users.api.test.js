// HTTP tests with supertest: user roles and admin actions use the real test database.
const { app, request, bearer, registerPlayer } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

test('PLAYER, HOST, and no token cannot list users', async () => {
  const player = await registerPlayer();
  const host = await bearer('FAC-0042');
  for (const auth of [player.auth, host, null]) {
    let req = request(app).get('/api/v1/users');
    if (auth) req = req.set('Authorization', auth);
    const res = await req;
    expect([401, 403]).toContain(res.status);
  }
});

test('ADMIN list 200 array without password_hash', async () => {
  const res = await request(app).get('/api/v1/users').set('Authorization', await bearer('ADM-0001'));
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(JSON.stringify(res.body)).not.toContain('password_hash');
});

test('ADMIN promotes registered player to HOST', async () => {
  const player = await registerPlayer();
  const res = await request(app).patch(`/api/v1/users/${player.user_id}/role`)
    .set('Authorization', await bearer('ADM-0001'))
    .send({ role: 'HOST' });
  expect(res.status).toBe(200);
  expect(res.body.role).toBe('HOST');
});

test('invalid role, own role, unknown id, and PLAYER access are rejected', async () => {
  const admin = await bearer('ADM-0001');
  const player = await registerPlayer();
  const invalid = await request(app).patch(`/api/v1/users/${player.user_id}/role`).set('Authorization', admin).send({ role: 'TEACHER' });
  expect(invalid.status).toBe(400);

  const adminMe = await request(app).post('/api/v1/auth/login').send({ school_id: 'ADM-0001', password: 'quizladder' });
  const adminId = adminMe.body.user.user_id;
  const own = await request(app).patch(`/api/v1/users/${adminId}/role`).set('Authorization', admin).send({ role: 'HOST' });
  expect(own.status).toBe(409);
  expect(own.body.error.code).toBe('CANNOT_CHANGE_OWN_ROLE');

  const unknown = await request(app).patch('/api/v1/users/999999/role').set('Authorization', admin).send({ role: 'HOST' });
  expect(unknown.status).toBe(404);
  expect(unknown.body.error.code).toBe('USER_NOT_FOUND');

  const forbidden = await request(app).patch(`/api/v1/users/${player.user_id}/role`).set('Authorization', player.auth).send({ role: 'HOST' });
  expect(forbidden.status).toBe(403);
});
