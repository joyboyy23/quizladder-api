# Changelog

All notable changes, newest first.

## [x.y.z] (Weeks 15 to 16): [Your summary]
- [Your change]

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
