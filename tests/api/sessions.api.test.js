// HTTP tests with supertest: session and player flows use the real test database.
const { app, request, bearer, registerPlayer } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

async function createLobby(setId) {
  const auth = await bearer('FAC-0042');
  return request(app).post('/api/v1/sessions').set('Authorization', auth).send({ question_set_id: setId });
}

test('create lobby as HOST and validation rules', async () => {
  const host = await bearer('FAC-0042');
  const player = await registerPlayer();
  const created = await createLobby(1);
  expect(created.status).toBe(201);
  expect(created.body.code).toMatch(/^\d{6}$/);
  expect(created.body.status).toBe('WAITING');
  expect(created.body).not.toHaveProperty('session_id');

  const ignored = await request(app).post('/api/v1/sessions').set('Authorization', host)
    .send({ question_set_id: 1, join_code: '123456' });
  expect(ignored.status).toBe(201);
  expect(ignored.body.code).not.toBe('123456');

  expect((await request(app).post('/api/v1/sessions').set('Authorization', player.auth).send({ question_set_id: 1 })).status).toBe(403);
  expect((await request(app).post('/api/v1/sessions').send({ question_set_id: 1 })).status).toBe(401);
  const missing = await request(app).post('/api/v1/sessions').set('Authorization', host).send({});
  expect(missing.status).toBe(400);
  const unknown = await request(app).post('/api/v1/sessions').set('Authorization', host).send({ question_set_id: 999999 });
  expect(unknown.status).toBe(404);
  expect(unknown.body.error.code).toBe('QUESTION_SET_NOT_FOUND');

  await request(app).patch(`/api/v1/sessions/${created.body.code}`)
    .set('Authorization', host).send({ status: 'FINISHED' });
  await request(app).patch(`/api/v1/sessions/${ignored.body.code}`)
    .set('Authorization', host).send({ status: 'FINISHED' });
});

test('get lobby success and code validation', async () => {
  const created = await createLobby(1);
  expect(created.status).toBe(201);
  expect((await request(app).get(`/api/v1/sessions/${created.body.code}`)).status).toBe(200);
  expect((await request(app).get('/api/v1/sessions/12345')).status).toBe(400);
  const missing = await request(app).get('/api/v1/sessions/999999');
  expect(missing.status).toBe(404);
  expect(missing.body.error.code).toBe('SESSION_NOT_FOUND');
  await request(app).patch(`/api/v1/sessions/${created.body.code}`)
    .set('Authorization', await bearer('FAC-0042')).send({ status: 'FINISHED' });
});

test('join, rejoin, nickname and colour constraints, players list', async () => {
  const created = await createLobby(1);
  expect(created.status).toBe(201);
  const code = created.body.code;
  const players = [];
  for (let index = 0; index < 4; index += 1) {
    players.push(await registerPlayer());
  }
  const first = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', players[0].auth)
    .send({ nickname: 'Bea', avatar_color: 'BLUE' });
  expect(first.status).toBe(201);
  expect(first.body.rejoined).toBe(false);
  expect(first.body.position).toBe(1);

  const rejoined = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', players[0].auth)
    .send({ nickname: 'Bea', avatar_color: 'BLUE' });
  expect(rejoined.status).toBe(200);
  expect(rejoined.body.rejoined).toBe(true);
  expect(rejoined.body.player_id).toBe(first.body.player_id);

  const nicknameTaken = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', players[1].auth)
    .send({ nickname: 'Bea', avatar_color: 'RED' });
  expect(nicknameTaken.status).toBe(409);
  expect(nicknameTaken.body.error.code).toBe('NICKNAME_TAKEN');

  const firstOther = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', players[1].auth)
    .send({ nickname: 'Carl', avatar_color: 'RED' });
  expect(firstOther.status).toBe(201);

  const otherFirstAgain = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', players[2].auth)
    .send({ nickname: 'Drew', avatar_color: 'BLUE' });
  expect(otherFirstAgain.body.error.code).toBe('AVATAR_COLOR_TAKEN');

  const shortName = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', players[2].auth)
    .send({ nickname: 'a', avatar_color: 'GREEN' });
  expect(shortName.status).toBe(400);

  expect((await request(app).post(`/api/v1/sessions/${code}/players`).send({ nickname: 'NoToken', avatar_color: 'GREEN' })).status).toBe(401);
  const list = await request(app).get(`/api/v1/sessions/${code}/players`);
  expect(list.status).toBe(200);
  expect(list.body.players.length).toBeGreaterThanOrEqual(2);

  await request(app).patch(`/api/v1/sessions/${code}`)
    .set('Authorization', await bearer('FAC-0042')).send({ status: 'FINISHED' });
});

test('session full and start validation', async () => {
  const created = await createLobby(1);
  expect(created.status).toBe(201);
  const code = created.body.code;
  const host = await bearer('FAC-0042');
  const players = [];
  for (let index = 0; index < 5; index += 1) players.push(await registerPlayer());
  for (let index = 0; index < 4; index += 1) {
    await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', players[index].auth)
      .send({ nickname: `P${index}`, avatar_color: ['RED', 'BLUE', 'GREEN', 'YELLOW'][index] });
  }
  const fifth = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', players[4].auth)
    .send({ nickname: 'P4', avatar_color: 'RED' });
  expect(fifth.status).toBe(409);
  expect(fifth.body.error.code).toBe('SESSION_FULL');

  const one = await createLobby(1);
  await request(app).post(`/api/v1/sessions/${one.body.code}/players`).set('Authorization', players[0].auth)
    .send({ nickname: 'Only', avatar_color: 'RED' });
  const startOne = await request(app).patch(`/api/v1/sessions/${one.body.code}`).set('Authorization', host).send({ status: 'PLAYING' });
  expect(startOne.status).toBe(409);
  expect(startOne.body.error.code).toBe('NOT_ENOUGH_PLAYERS');

  const badStatus = await request(app).patch(`/api/v1/sessions/${code}`).set('Authorization', host).send({ status: 'WAITING' });
  expect(badStatus.status).toBe(400);
  const playerPatch = await request(app).patch(`/api/v1/sessions/${code}`).set('Authorization', players[0].auth).send({ status: 'PLAYING' });
  expect(playerPatch.status).toBe(403);

  await request(app).patch(`/api/v1/sessions/${code}`).set('Authorization', host).send({ status: 'FINISHED' });
  await request(app).patch(`/api/v1/sessions/${one.body.code}`).set('Authorization', host).send({ status: 'FINISHED' });
});

test('started and finished join rules', async () => {
  const created = await createLobby(1);
  const code = created.body.code;
  const host = await bearer('FAC-0042');
  const a = await registerPlayer();
  const b = await registerPlayer();
  const newcomer = await registerPlayer();
  const joinA = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', a.auth).send({ nickname: 'Ana', avatar_color: 'RED' });
  const joinB = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', b.auth).send({ nickname: 'Ben', avatar_color: 'BLUE' });
  expect(joinA.status).toBe(201);
  expect(joinB.status).toBe(201);
  const started = await request(app).patch(`/api/v1/sessions/${code}`).set('Authorization', host).send({ status: 'PLAYING' });
  expect(started.status).toBe(200);
  expect(started.body.status).toBe('PLAYING');

  const seatedElsewhere = await request(app).post('/api/v1/sessions/999999/players').set('Authorization', a.auth).send({ nickname: 'Else', avatar_color: 'GREEN' });
  expect([404, 409]).toContain(seatedElsewhere.status);

  const newcomerStarted = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', newcomer.auth).send({ nickname: 'New', avatar_color: 'GREEN' });
  expect(newcomerStarted.status).toBe(409);
  expect(newcomerStarted.body.error.code).toBe('SESSION_NOT_JOINABLE');

  await request(app).patch(`/api/v1/sessions/${code}`).set('Authorization', host).send({ status: 'FINISHED' });
  const newcomerFinished = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', newcomer.auth).send({ nickname: 'New', avatar_color: 'GREEN' });
  expect(newcomerFinished.status).toBe(409);
  expect(newcomerFinished.body.error.code).toBe('SESSION_ENDED');

  const seatedRejoin = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', a.auth).send({ nickname: 'Ana', avatar_color: 'RED' });
  expect(seatedRejoin.status).toBe(200);
  expect(seatedRejoin.body.rejoined).toBe(true);

  const invalidTransition = await request(app).patch(`/api/v1/sessions/${code}`).set('Authorization', host).send({ status: 'PLAYING' });
  expect(invalidTransition.status).toBe(409);
  expect(invalidTransition.body.error.code).toBe('INVALID_STATUS_TRANSITION');
});
