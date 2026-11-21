// HTTP tests of the Week 15 documentation endpoints.
const { app, request } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

test('GET /openapi.json is an OpenAPI 3 document with the package version', async () => {
  const res = await request(app).get('/api/v1/openapi.json');
  expect(res.status).toBe(200);
  expect(res.body.openapi).toMatch(/^3\./);
  expect(res.body.info.version).toBe(require('../../package.json').version);
});

test('every documented operation has a summary and at least one response', async () => {
  const { body } = await request(app).get('/api/v1/openapi.json');
  const operations = Object.entries(body.paths).flatMap(([url, item]) => Object.entries(item)
    .filter(([verb]) => ['get', 'post', 'put', 'patch', 'delete'].includes(verb))
    .map(([verb, op]) => ({ name: `${verb.toUpperCase()} ${url}`, op })));
  expect(operations.length).toBeGreaterThanOrEqual(15);
  operations.forEach(({ name, op }) => {
    expect({ name, summary: Boolean(op.summary) }).toEqual({ name, summary: true });
    expect(Object.keys(op.responses || {}).length).toBeGreaterThan(0);
  });
});

test('GET /docs/ shows Swagger UI', async () => {
  const res = await request(app).get('/api/v1/docs/');
  expect(res.status).toBe(200);
  expect(res.text).toMatch(/swagger/i);
});

test('every $ref in the document resolves', async () => {
  const { body } = await request(app).get('/api/v1/openapi.json');

  function walk(value) {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== 'object') return;
    Object.entries(value).forEach(([key, child]) => {
      if (key === '$ref' && typeof child === 'string' && child.startsWith('#/components/')) {
        const target = child.slice(2).split('/').reduce((current, segment) => current?.[segment], body);
        expect(target).toBeDefined();
      }
      walk(child);
    });
  }

  walk(body);
});

test('the documentation includes every required endpoint path', async () => {
  const { body } = await request(app).get('/api/v1/openapi.json');
  const required = [
    '/users',
    '/question-sets',
    '/question-sets/{id}/questions',
    '/question-sets/{id}/cover',
    '/sessions/{code}/leaderboard',
    '/results',
  ];
  required.forEach((path) => expect(body.paths).toHaveProperty(path));
});

test('every operation security scheme is bearerAuth or hubKey', async () => {
  const { body } = await request(app).get('/api/v1/openapi.json');
  const allowed = new Set(['bearerAuth', 'hubKey']);

  Object.values(body.paths).forEach((pathItem) => {
    ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
      const operation = pathItem[method];
      if (!operation?.security) return;
      operation.security.forEach((requirement) => {
        Object.keys(requirement).forEach((scheme) => expect(allowed).toContain(scheme));
      });
    });
  });
});
