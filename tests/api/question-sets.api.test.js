// HTTP tests with supertest: question-set CRUD and cover uploads use the real test database.
const path = require('path');
const fs = require('fs');
const { app, request, bearer, registerPlayer } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

test('list requires auth and rejects PLAYER', async () => {
  const noToken = await request(app).get('/api/v1/question-sets');
  expect(noToken.status).toBe(401);
  const player = await registerPlayer();
  const forbidden = await request(app).get('/api/v1/question-sets').set('Authorization', player.auth);
  expect(forbidden.status).toBe(403);
});

test('default list envelope and paging/search/sort', async () => {
  const auth = await bearer('FAC-0042');
  const defaultRes = await request(app).get('/api/v1/question-sets').set('Authorization', auth);
  expect(defaultRes.status).toBe(200);
  expect(defaultRes.body.meta).toEqual(expect.objectContaining({ page: 1, limit: 10 }));
  expect(defaultRes.body.meta.total).toBeGreaterThanOrEqual(3);

  const page = await request(app).get('/api/v1/question-sets?page=2&limit=1').set('Authorization', auth);
  expect(page.body.data).toHaveLength(1);

  const search = await request(app).get('/api/v1/question-sets?q=library').set('Authorization', auth);
  expect(search.body.data.some((set) => set.name === 'Library Basics')).toBe(true);

  const empty = await request(app).get('/api/v1/question-sets?q=zzzznomatch').set('Authorization', auth);
  expect(empty.body.data).toEqual([]);
  expect(empty.body.meta.total).toBe(0);

  const escaped = await request(app).get('/api/v1/question-sets?q=%25').set('Authorization', auth);
  expect(escaped.body.meta.total).toBe(0);

  const descending = await request(app).get('/api/v1/question-sets?sort=id&order=desc').set('Authorization', auth);
  expect(descending.status).toBe(200);
  expect(descending.body.data.map((set) => set.id)).toEqual(descending.body.data.map((set) => set.id).sort((a, b) => b - a));
});

test('invalid list parameters are rejected', async () => {
  const auth = await bearer('FAC-0042');
  for (const url of ['/api/v1/question-sets?sort=password_hash', '/api/v1/question-sets?limit=500', '/api/v1/question-sets?page=0']) {
    const res = await request(app).get(url).set('Authorization', auth);
    expect(res.status).toBe(400);
  }
});

test('HOST creates set with owner and duplicate/name validation', async () => {
  const auth = await bearer('FAC-0042');
  const name = `Test Set ${Date.now()}`;
  const created = await request(app).post('/api/v1/question-sets').set('Authorization', auth).send({ name });
  expect(created.status).toBe(201);
  expect(created.body.owner_id).toBeDefined();

  const duplicate = await request(app).post('/api/v1/question-sets').set('Authorization', auth).send({ name });
  expect(duplicate.status).toBe(409);
  expect(duplicate.body.error.code).toBe('NAME_TAKEN');

  const short = await request(app).post('/api/v1/question-sets').set('Authorization', auth).send({ name: 'ab' });
  expect(short.status).toBe(400);
});

test('read one, missing id, bad id, include questions and invalid include', async () => {
  const auth = await bearer('FAC-0042');
  const list = await request(app).get('/api/v1/question-sets').set('Authorization', auth);
  const setId = list.body.data[0].id;

  expect((await request(app).get(`/api/v1/question-sets/${setId}`).set('Authorization', auth)).status).toBe(200);
  const missing = await request(app).get('/api/v1/question-sets/999999').set('Authorization', auth);
  expect(missing.status).toBe(404);
  expect(missing.body.error.code).toBe('QUESTION_SET_NOT_FOUND');
  expect((await request(app).get('/api/v1/question-sets/abc').set('Authorization', auth)).status).toBe(400);

  const withQuestions = await request(app).get('/api/v1/question-sets/1?include=questions').set('Authorization', auth);
  if (withQuestions.status === 200) {
    expect(withQuestions.body.questions).toHaveLength(5);
    for (const question of withQuestions.body.questions) {
      expect(question.choices).toHaveLength(4);
      expect(question.choices.filter((choice) => choice.is_correct)).toHaveLength(1);
    }
  }
  const includeAnswers = await request(app).get('/api/v1/question-sets/1?include=answers').set('Authorization', auth);
  expect(includeAnswers.status).toBe(400);
});

test('question create, validation and edit/delete lifecycle', async () => {
  const auth = await bearer('FAC-0042');
  const createdSet = await request(app).post('/api/v1/question-sets').set('Authorization', auth)
    .send({ name: `Question Set ${Date.now()}` });
  expect(createdSet.status).toBe(201);
  const setId = createdSet.body.id;

  const first = await request(app).post(`/api/v1/question-sets/${setId}/questions`).set('Authorization', auth).send({
    text: 'First question?',
    choices: [
      { text: 'A', is_correct: true }, { text: 'B', is_correct: false },
      { text: 'C', is_correct: false }, { text: 'D', is_correct: false },
    ],
  });
  expect(first.status).toBe(201);
  expect(first.body.position).toBe(1);

  const second = await request(app).post(`/api/v1/question-sets/${setId}/questions`).set('Authorization', auth).send({
    text: 'Second question?',
    choices: [
      { text: 'A', is_correct: false }, { text: 'B', is_correct: true },
      { text: 'C', is_correct: false }, { text: 'D', is_correct: false },
    ],
  });
  expect(second.status).toBe(201);
  expect(second.body.position).toBe(2);

  const twoCorrect = await request(app).post(`/api/v1/question-sets/${setId}/questions`).set('Authorization', auth).send({
    text: 'Two correct?', choices: [
      { text: 'A', is_correct: true }, { text: 'B', is_correct: true },
      { text: 'C', is_correct: false }, { text: 'D', is_correct: false },
    ],
  });
  expect(twoCorrect.status).toBe(400);

  const threeChoices = await request(app).post(`/api/v1/question-sets/${setId}/questions`).set('Authorization', auth).send({
    text: 'Three choices?', choices: [
      { text: 'A', is_correct: true }, { text: 'B', is_correct: false }, { text: 'C', is_correct: false },
    ],
  });
  expect(threeChoices.status).toBe(400);

  const missingText = await request(app).post(`/api/v1/question-sets/${setId}/questions`).set('Authorization', auth).send({
    choices: [{ text: 'A', is_correct: true }, { text: 'B', is_correct: false }, { text: 'C', is_correct: false }, { text: 'D', is_correct: false }],
  });
  expect(missingText.status).toBe(400);

  const player = await registerPlayer();
  const admin = await bearer('ADM-0001');
  await request(app).patch(`/api/v1/users/${player.user_id}/role`).set('Authorization', admin).send({ role: 'HOST' });
  const forbidden = await request(app).post(`/api/v1/question-sets/${setId}/questions`).set('Authorization', player.auth).send({
    text: 'Forbidden?', choices: [
      { text: 'A', is_correct: true }, { text: 'B', is_correct: false },
      { text: 'C', is_correct: false }, { text: 'D', is_correct: false },
    ],
  });
  expect(forbidden.status).toBe(403);

  const edited = await request(app).patch(`/api/v1/question-sets/${setId}/questions/${first.body.id}`).set('Authorization', auth).send({
    text: 'Edited question?', choices: [
      { text: 'A', is_correct: true }, { text: 'B', is_correct: false },
      { text: 'C', is_correct: false }, { text: 'D', is_correct: false },
    ],
  });
  expect(edited.status).toBe(200);
  expect(edited.body.choices).toHaveLength(4);

  const removed = await request(app).delete(`/api/v1/question-sets/${setId}/questions/${first.body.id}`).set('Authorization', auth);
  expect(removed.status).toBe(204);
  const removedAgain = await request(app).delete(`/api/v1/question-sets/${setId}/questions/${first.body.id}`).set('Authorization', auth);
  expect(removedAgain.status).toBe(404);

  await request(app).delete(`/api/v1/question-sets/${setId}`).set('Authorization', auth);
});

test('Library Basics is frozen for question writes', async () => {
  const auth = await bearer('FAC-0042');
  const setRes = await request(app).get('/api/v1/question-sets?q=Library Basics').set('Authorization', auth);
  const setId = setRes.body.data[0].id;
  const post = await request(app).post(`/api/v1/question-sets/${setId}/questions`).set('Authorization', auth).send({
    text: 'Frozen?', choices: [
      { text: 'A', is_correct: true }, { text: 'B', is_correct: false },
      { text: 'C', is_correct: false }, { text: 'D', is_correct: false },
    ],
  });
  expect(post.status).toBe(409);
  expect(post.body.error.code).toBe('QUESTION_SET_IN_USE');
});

test('cover upload lifecycle and validation', async () => {
  const auth = await bearer('FAC-0042');
  const created = await request(app).post('/api/v1/question-sets').set('Authorization', auth)
    .send({ name: `Cover Set ${Date.now()}` });
  expect(created.status).toBe(201);
  const setId = created.body.id;
  const fixture = path.join(process.cwd(), 'postman', 'fixtures');

  const uploaded = await request(app).put(`/api/v1/question-sets/${setId}/cover`).set('Authorization', auth)
    .attach('cover', path.join(fixture, 'cover.png'));
  expect(uploaded.status).toBe(200);
  expect(uploaded.body.cover_url).toMatch(new RegExp(`/uploads/covers/set-${setId}-.*\\.png`));
  const served = await request(app).get(uploaded.body.cover_url);
  expect(served.status).toBe(200);
  expect(served.headers['content-type']).toContain('image/png');

  const wrongType = await request(app).put(`/api/v1/question-sets/${setId}/cover`).set('Authorization', auth)
    .attach('cover', path.join(fixture, 'not-a-picture.txt'));
  expect(wrongType.status).toBe(400);
  expect(wrongType.body.error.code).toBe('INVALID_FILE_TYPE');

  const tooBig = await request(app).put(`/api/v1/question-sets/${setId}/cover`).set('Authorization', auth)
    .attach('cover', path.join(fixture, 'too-big.png'));
  expect([413, 400]).toContain(tooBig.status);
  if (tooBig.status === 413) expect(tooBig.body.error.code).toBe('FILE_TOO_LARGE');

  const missing = await request(app).put(`/api/v1/question-sets/${setId}/cover`).set('Authorization', auth);
  expect(missing.status).toBe(400);
  expect(missing.body.error.code).toBe('COVER_REQUIRED');

  await request(app).delete(`/api/v1/question-sets/${setId}`).set('Authorization', auth);
});
