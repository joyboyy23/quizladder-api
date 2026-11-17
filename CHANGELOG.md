# Changelog

All notable changes, newest first.

## [x.y.z] (Weeks 15 to 16): [Your summary]
- [Your change]

## [x.y.z] (Week 14): [Your summary]
- [Your change]

## [x.y.z] (Week 13): [Your summary]
- [Your change]

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
