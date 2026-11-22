# Changelog

All notable changes, newest first.

## 1.6.0 (Week 16): SE1 portfolio and release
- Added the five portfolio documents in docs/: technical specification, data dictionary, API reference, user guide and SE2 handoff.
- Added the six diagrams in docs/diagrams/: use case, class, sequence, activity, ERD and architecture.
- Added the docs:dictionary and docs:api scripts. The data dictionary is generated from the real database and the API reference from src/docs/openapi.yaml.
- Updated the README with a documentation section, the full environment variable list, demo accounts and the current test results.
- Current results: Jest 123 tests in 17 files with 96.23% line coverage; Postman 163 requests and 324 tests, all passing on a fresh database.
- Bumped the version to 1.6.0 in package.json, package-lock.json and the OpenAPI examples.

## 1.5.0 (Week 15): API documentation
- Added a complete OpenAPI 3.0.3 document for 29 operations, including account, question-set, question, session and gameplay endpoints.
- Added Swagger UI at `/api/v1/docs/` and the raw OpenAPI document at `/api/v1/openapi.json`.
- Enabled the documentation API test and added checks for `$ref` resolution, required paths and allowed security schemes.
- Corrected stale examples and response codes to match the real validators, serializers and Hub Contract.
- Added Render Blueprint deployment guidance, live API and Swagger links, and free-plan setup notes.

## 1.4.0 (Week 14): tests and server preparation
- Added Jest unit and supertest HTTP tests: 117 tests across mocked service suites and real API flows, with 96.23% line coverage.
- Added DATABASE_URL and DB_SSL support, Helmet, CORS, trust proxy, and separate test database naming.
- Added start:render for migrations and first-admin creation and named the Render blueprint quizladder services.
- Added the host row on demand so live sessions can start without seeded demo data.

## 1.3.0 (Week 13): gameplay
- Added transactional turn phases, server-side dice rolls, lazy timeout handling, question and punishment events, and automatic session completion
- Added public game state and leaderboard endpoints, test-only roll overrides, and a deterministic Postman whole-game folder

## 1.2.0 (Week 13): question bank
- Added question-set ownership, cover uploads, paged/searchable/sortable set lists, and nested question/choice CRUD
- Added server-assigned question positions, four-choice validation, a 100-question limit, and freeze rules for sets used in games
- Added demo set owners and question positions, plus Postman coverage and API documentation for the question bank

## 1.1.0 (Week 12): accounts, passwords and tokens
- Added POST /auth/register, POST /auth/login and GET /auth/me; passwords are stored as bcrypt hashes and login returns a signed JWT
- Added admin routes GET /users and PATCH /users/:id/role
- Roles renamed to PLAYER, HOST and ADMIN; a new account is always a PLAYER
- Added users.password_hash, a demo admin (ADM-0001) and demo passwords to the seed data
- Replaced the X-Demo-User stand-in with Bearer tokens; question-set and session routes now need HOST or ADMIN
- Constraint map now answers 409 for a taken school ID or email
- Merged the Postman collections into one with 77 requests

## 1.0.0 (Weeks 10 to 11): foundation
- Express 5 API with PostgreSQL and Sequelize: migrations and seed data for all 10 tables
- Hub Contract endpoints: /health, /game-info and /results
- Question sets with full CRUD, validation, one error format and a constraint map
- Sessions with a server-made join code, join and rejoin, and the one-game-at-a-time rule
