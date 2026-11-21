// HTTP tests with supertest: a real request goes through the whole app
// (middleware, validator, controller, service, repository) to the TEST database.
const { app, request } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

test('GET /health answers 200 with the database up', async () => {
  const res = await request(app).get('/api/v1/health');
  expect(res.status).toBe(200);
  expect(res.body.database).toBe('up');
});

test('an unknown address answers 404 in the error format', async () => {
  const res = await request(app).get('/api/v1/nowhere');
  expect(res.status).toBe(404);
  expect(res.body.error).toEqual({ code: expect.any(String), message: expect.any(String) });
});

test('GET /results needs the Hub key', async () => {
  expect((await request(app).get('/api/v1/results')).status).toBe(401);
  const res = await request(app).get('/api/v1/results').set('X-Hub-Key', process.env.HUB_API_KEY);
  expect(res.status).toBe(200);
  expect(res.body.results[0].podium.length).toBeGreaterThanOrEqual(3);
});

test('GET /game-info answers QuizLadder limits', async () => {
  const res = await request(app).get('/api/v1/game-info');
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ slug: 'quizladder', min_players: 2, max_players: 4 });
});

test('GET /results future since answers an empty list', async () => {
  const res = await request(app).get('/api/v1/results?since=2999-01-01T00:00:00Z')
    .set('X-Hub-Key', process.env.HUB_API_KEY);
  expect(res.status).toBe(200);
  expect(res.body.results).toEqual([]);
});

test('GET /results rejects an invalid since date', async () => {
  const res = await request(app).get('/api/v1/results?since=not-a-date')
    .set('X-Hub-Key', process.env.HUB_API_KEY);
  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe('INVALID_SINCE');
});

test('game 482913 has 3 ranked podium entries', async () => {
  const res = await request(app).get('/api/v1/results')
    .set('X-Hub-Key', process.env.HUB_API_KEY);
  expect(res.status).toBe(200);
  const game = res.body.results.find((item) => item.session_code === '482913');
  expect(game).toBeDefined();
  expect(game.podium).toHaveLength(3);
  expect(game.podium.map((player) => player.rank)).toEqual([1, 2, 3]);
});

test('helmet adds nosniff and omits x-powered-by', async () => {
  const res = await request(app).get('/api/v1/health');
  expect(res.headers['x-content-type-options']).toBe('nosniff');
  expect(res.headers['x-powered-by']).toBeUndefined();
});

test('a request without Origin works', async () => {
  const res = await request(app).get('/api/v1/health');
  expect(res.status).toBe(200);
  expect(res.headers['access-control-allow-origin']).toBeUndefined();
});

describe('CORS', () => {
  const allowed = process.env.CORS_ORIGINS.split(',')[0].trim();
  test('a listed origin is allowed', async () => {
    const res = await request(app).options('/api/v1/health').set('Origin', allowed).set('Access-Control-Request-Method', 'GET');
    expect(res.headers['access-control-allow-origin']).toBe(allowed);
  });
  test('any other origin gets no permission', async () => {
    const res = await request(app).options('/api/v1/health').set('Origin', 'http://evil.test').set('Access-Control-Request-Method', 'GET');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
