// HTTP tests with supertest: gameplay flows use the real test database and real seeded questions.
const { app, request, bearer, registerPlayer } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

async function freshGame() {
  const host = await bearer('FAC-0042');
  const a = await registerPlayer();
  const b = await registerPlayer();
  const created = await request(app).post('/api/v1/sessions').set('Authorization', host).send({ question_set_id: 1 });
  const code = created.body.code;
  const joinA = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', a.auth)
    .send({ nickname: `A${Date.now()}`, avatar_color: 'RED' });
  const joinB = await request(app).post(`/api/v1/sessions/${code}/players`).set('Authorization', b.auth)
    .send({ nickname: `B${Date.now()}`, avatar_color: 'BLUE' });
  await request(app).patch(`/api/v1/sessions/${code}`).set('Authorization', host).send({ status: 'PLAYING' });
  return { host, a, b, code, joinA, joinB };
}

async function finishGame(code, host) {
  await request(app).patch(`/api/v1/sessions/${code}`).set('Authorization', host).send({ status: 'FINISHED' });
}

test('public state and leaderboard never expose session_id', async () => {
  const game = await freshGame();
  const state = await request(app).get(`/api/v1/sessions/${game.code}/state`);
  expect(state.status).toBe(200);
  expect(JSON.stringify(state.body)).not.toContain('session_id');
  const leaderboard = await request(app).get(`/api/v1/sessions/${game.code}/leaderboard`);
  expect(leaderboard.status).toBe(200);
  expect(JSON.stringify(leaderboard.body)).not.toContain('session_id');
  await finishGame(game.code, game.host);
});

test('roll authorization and phase validation', async () => {
  const game = await freshGame();
  const noToken = await request(app).post(`/api/v1/sessions/${game.code}/roll`).send({ dice: 3 });
  expect(noToken.status).toBe(401);
  const unseated = await registerPlayer();
  const notSeated = await request(app).post(`/api/v1/sessions/${game.code}/roll`).set('Authorization', unseated.auth).send({ dice: 3 });
  expect(notSeated.status).toBe(403);
  expect(notSeated.body.error.code).toBe('NOT_SEATED');

  const notTurn = await request(app).post(`/api/v1/sessions/${game.code}/roll`).set('Authorization', game.b.auth).send({ dice: 3 });
  expect(notTurn.status).toBe(409);
  expect(notTurn.body.error.code).toBe('NOT_YOUR_TURN');

  const badDice = await request(app).post(`/api/v1/sessions/${game.code}/roll`).set('Authorization', game.a.auth).send({ dice: 9 });
  expect(badDice.status).toBe(400);

  const question = await request(app).post(`/api/v1/sessions/${game.code}/answers`).set('Authorization', game.a.auth).send({ choice_index: 1 });
  expect(question.status).toBe(409);
  expect(question.body.error.code).toBe('WRONG_PHASE');

  const punish = await request(app).post(`/api/v1/sessions/${game.code}/punish`).set('Authorization', game.a.auth).send({ target_player_id: 1, amount: 2 });
  expect(punish.status).toBe(409);
  await finishGame(game.code, game.host);
});

test('A and B climb the ladder and turns pass correctly', async () => {
  const game = await freshGame();
  const first = await request(app).post(`/api/v1/sessions/${game.code}/roll`).set('Authorization', game.a.auth).send({ dice: 3 });
  expect(first.status).toBe(200);
  expect(first.body).toMatchObject({ from: 1, to: 25, tile_type: 'LADDER', next_phase: 'ROLL' });

  const repeatedA = await request(app).post(`/api/v1/sessions/${game.code}/roll`).set('Authorization', game.a.auth).send({ dice: 3 });
  expect(repeatedA.status).toBe(409);
  expect(repeatedA.body.error.code).toBe('NOT_YOUR_TURN');

  const second = await request(app).post(`/api/v1/sessions/${game.code}/roll`).set('Authorization', game.b.auth).send({ dice: 3 });
  expect(second.status).toBe(200);
  expect(second.body).toMatchObject({ from: 1, to: 25, tile_type: 'LADDER' });
  await finishGame(game.code, game.host);
});

test('QUESTION event exposes choices and answer moves 2 tiles', async () => {
  const game = await freshGame();
  const rolled = await request(app).post(`/api/v1/sessions/${game.code}/roll`).set('Authorization', game.a.auth)
    .send({ dice: 6, event: 'QUESTION' });
  expect(rolled.status).toBe(200);
  expect(rolled.body).toMatchObject({ to: 7, tile_type: 'EVENT', next_phase: 'QUESTION' });

  const question = await request(app).get(`/api/v1/sessions/${game.code}/question`).set('Authorization', game.a.auth);
  expect(question.status).toBe(200);
  expect(question.body.choices).toHaveLength(4);
  expect(JSON.stringify(question.body)).not.toContain('is_correct');

  const answer = await request(app).post(`/api/v1/sessions/${game.code}/answers`).set('Authorization', game.a.auth)
    .send({ choice_index: 1 });
  expect(answer.status).toBe(200);
  expect(typeof answer.body.correct).toBe('boolean');
  expect([9, 5]).toContain(answer.body.to);

  const badChoice = await request(app).post(`/api/v1/sessions/${game.code}/answers`).set('Authorization', game.a.auth).send({ choice_index: 9 });
  expect(badChoice.status).toBe(400);

  const answerInRoll = await request(app).post(`/api/v1/sessions/${game.code}/answers`).set('Authorization', game.b.auth).send({ choice_index: 1 });
  expect(answerInRoll.status).toBe(409);
  expect(answerInRoll.body.error.code).toBe('WRONG_PHASE');
  await finishGame(game.code, game.host);
});

test('PUNISHMENT event validates target and amount and moves another player', async () => {
  const game = await freshGame();
  const rolled = await request(app).post(`/api/v1/sessions/${game.code}/roll`).set('Authorization', game.a.auth)
    .send({ dice: 6, event: 'PUNISHMENT' });
  expect(rolled.status).toBe(200);
  expect(rolled.body).toMatchObject({ to: 7, tile_type: 'EVENT', next_phase: 'PUNISH' });

  const players = await request(app).get(`/api/v1/sessions/${game.code}/players`);
  const target = players.body.players.find((player) => player.nickname !== game.joinA.body.nickname);
  expect(target).toBeDefined();

  const self = await request(app).post(`/api/v1/sessions/${game.code}/punish`).set('Authorization', game.a.auth)
    .send({ target_player_id: game.joinA.body.player_id, amount: 2 });
  expect(self.status).toBe(409);
  expect(self.body.error.code).toBe('INVALID_TARGET');

  const valid = await request(app).post(`/api/v1/sessions/${game.code}/punish`).set('Authorization', game.a.auth)
    .send({ target_player_id: target.player_id, amount: 2 });
  expect(valid.status).toBe(200);
  expect(valid.body.to).toBeGreaterThanOrEqual(1);

  const badAmount = await request(app).post(`/api/v1/sessions/${game.code}/punish`).set('Authorization', game.a.auth)
    .send({ target_player_id: target.player_id, amount: 7 });
  expect(badAmount.status).toBe(400);
  await finishGame(game.code, game.host);
});

test('leaderboard limit and finished results are consistent', async () => {
  const game = await freshGame();
  const badLimit = await request(app).get(`/api/v1/sessions/${game.code}/leaderboard?limit=0`);
  expect(badLimit.status).toBe(400);
  await finishGame(game.code, game.host);

  const since = new Date(Date.now() - 60000).toISOString();
  const results = await request(app).get(`/api/v1/results?since=${encodeURIComponent(since)}`)
    .set('X-Hub-Key', process.env.HUB_API_KEY);
  expect(results.status).toBe(200);
  const listed = results.body.results.find((item) => item.session_code === game.code);
  if (listed) {
    expect(listed.players).toHaveLength(2);
    expect(listed.players.every((player) => player.completed === false)).toBe(true);
    expect(listed.podium).toEqual([]);
  }
});
