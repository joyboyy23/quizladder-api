# Development journey: QuizLadder API

Student: Joenilo Estillero · Section: 3-1 · Group: 8

One entry per milestone, written the week you did it. Newest at the bottom.

## M1 · Accounts, passwords and tokens
- Dates worked: Nov 12 to Nov 16, 2026 · Time spent: 7 hours
- Goal: Replace the X-Demo-User stand-in with real accounts: register, log in with a password, and prove identity with a token.
- What I built: Migrations for the new roles and users.password_hash; seeders for a demo admin and demo passwords; auth.validator, auth.service, user.service, two controllers and two route files; POST /auth/register, POST /auth/login, GET /auth/me, GET /users, PATCH /users/:id/role; env.js exports for JWT and bcrypt; one merged Postman collection with a login folder and an Accounts folder.
- Evidence: https://github.com/joyboyy23/quizladder-api/pull/3 · f5fdfb7 feat(auth): register, login and me endpoints; 3e8debb feat(users): admin routes for accounts and roles; 946f0a2 chore(postman): merge Module1 and Module2 into one collection
- Problem I hit: My Postman run passed 149 of 151 assertions. "Join, closed FINISHED" expected 409 SESSION_ENDED but got 200, because the test used Dino, who already has a seat in that finished game.
- How I solved it: The first idea was to change player.service so a finished game is checked before a rejoin. I checked the Week 11 deck instead: the rejoin question comes first, so a returning player always gets their seat back. The code was right and the test was wrong. I changed the test to use the admin, who has no seat anywhere, and added a second request showing Dino's rejoin returns 200 with his old position.
- Decision I made and why: I renamed the roles to PLAYER, HOST and ADMIN because the automatic check requires a new account to be a PLAYER. The cost was one migration that converts existing rows, plus an edit to my Week 10 seeder. I also kept reads of a game by code public so players can see a lobby; only writes need a token.
- Changes to my design set: users.role CHECK is now PLAYER, HOST or ADMIN (was STUDENT, FACULTY, STAFF); users.password_hash VARCHAR(60), nullable; one demo admin added to the seed data; the endpoint table gains 5 rows (/auth/register, /auth/login, /auth/me, /users, /users/:id/role); "who may call it" on question sets and sessions is now HOST or ADMIN; new error codes SCHOOL_ID_TAKEN, EMAIL_TAKEN, INVALID_CREDENTIALS, INVALID_TOKEN, CANNOT_CHANGE_OWN_ROLE and USER_NOT_FOUND.
- What I would explain to a classmate: A wrong password and an unknown school ID return the exact same 401, so nobody can use the login form to find out which accounts exist.
- AI tools: I used Claude to plan draft the code, and use the free tier copilot in vscode to generate the Postman collection and debug any errors to the code.

## M2 · The question bank
- Dates worked: Nov 17, 2026 · Time spent: 6 hours
- Goal: Give hosts a question bank: paged lists, nested questions and choices, and a cover upload.
- What I built: migrations `db/migrations/20261117020000-add-owner-and-cover-to-question-sets.js` and `db/migrations/20261117020100-add-position-to-questions.js`; seeders `db/seeders/20261117020200-demo-question-set-owners.js` and `db/seeders/20261117020300-demo-question-positions.js`; ownership, cover and position model fields; `src/lib/cover-files.js`, `src/middlewares/owned-question-set.js`, and the `question.validator`, `question.repository`, `question.service`, and `question.controller` layers; updated question-set layers, session repository, routes and constraint map. Endpoints include paged/searchable `GET /question-sets`, `GET /question-sets/:id?include=questions`, nested question list/create/edit/delete, and `PUT /question-sets/:id/cover`. Updated the Postman collection, README and changelog.
- Evidence: https://github.com/joyboyy23/quizladder-api/pull/5 · e601277 test(postman): add the question bank folder and fixtures; 53f194a feat(routes): add nested question routes, cover upload and position conflict; dfa6ed3 feat(questions): add nested questions with transactions
- Problem I hit: `npm run check` first failed the cover fetch because the pre-request script used the collection's local port 3001 while CI runs the API on port 3099.
- How I solved it: I changed the script to resolve the effective `baseUrl`, then reran the check; all 120 Postman requests and 241 assertions passed.
- Decision I made and why: Question sets have an owner (`owner_id`); only the owner or an ADMIN may change them, and a set used by a game is frozen. Cost: a seeded set needed an owner, so a new seeder assigns Faye.
- Changes to my design set: ERD and data dictionary: `question_sets.owner_id` and `cover_picture`, `questions.position` (UNIQUE with `question_set_id`). Endpoint table: nested question routes, `include=questions`, cover upload.
- What I would explain to a classmate: ?page and ?limit skip some rows and take the next ones. Every list answers with data and meta so the client knows the total and number of pages.
- AI tools: GitHub Copilot (agent mode) implemented this milestone from the user-provided plan PDF.

## M3 · Gameplay
- Dates worked: Nov 17, 2026 · Time spent: 8 hours
- Goal: Implement multiplayer turns, board movement, event choices, timeouts, and finish order using persisted game state.
- What I built: Reversible gameplay-state migration and seeded game setup; pure board/game rules; locked transactional gameplay services and repositories; validated state, roll, question, answer, punishment and leaderboard endpoints; deterministic Postman gameplay scenarios. Updated the README and API documentation for the rules and errors.
- Evidence: https://github.com/joyboyy23/quizladder-api/pull/6 · 4c4df92 feat(db): add gameplay state to game_sessions and unique turn number; a88a2d6 feat(gameplay): add roll, question, answer, punish and timeout rules; f216efb feat(gameplay): add state, roll, answer, punish and leaderboard endpoints
- Problem I hit: Check line J needs a finished game, but the server rolls random dice, so the Postman collection could not reach tile 100 by itself.
- How I solved it: I added test-only optional `dice` and `event` on POST /roll, honoured only when NODE_ENV is not production. The fixed path [3,6,2,1,5,2,6] climbs four ladders, skips event tiles, and both players finish.
- Decision I made and why: Gameplay state stays in the database; timeouts are applied lazily under the game-session lock so overlapping rolls cannot advance the same turn twice. Test dice/event overrides are ignored in production.
- Changes to my design set: Added current player, phase, phase start, pending question and turn-number state; added turn-number uniqueness; the session finishes only after all players finish. Added gameplay endpoints and error codes.
- What I would explain to a classmate: The server owns the dice and the clock, because anything the client sends can be edited.
- AI tools: GitHub Copilot (agent mode) implemented this milestone from the user-provided gameplay requirements.

## M4 · Automated tests and server preparation
- Dates worked: Nov 18, 2026 · Time spent: 6 hours
- Goal: Add deterministic automated coverage and prepare the API for a server environment with no demo seeders.
- What I built: Jest unit suites and supertest HTTP suites in `tests/unit` and `tests/api`; 117 tests with 96.23% line coverage; shared test helpers in `tests/setup`; separate test-database configuration; URL/SSL database support; Helmet, CORS and trust proxy middleware; `start:render`; and on-demand librarian host creation.
- Evidence: https://github.com/joyboyy23/quizladder-api/pull/7 and https://github.com/joyboyy23/quizladder-api/pull/8 · 6b82a6e feat(app): add helmet, CORS allowlist and trust proxy; b4fd0a9 feat(config): support DATABASE_URL, DB_SSL and a separate test database; 4bbe7ac fix(sessions): create the librarian host on demand so POST /sessions works without seeders
- Problem I hit: The old results example unit test ranked players by score, but this project ranks finishers by finish_position. A server database had no seeded librarian host, so creating a game could return 500. Tests also needed to avoid leaving accounts in games or changing seeded accounts.
- How I solved it: I rewrote the stale results test with finish-position and incomplete-player cases. I made session creation find or create the librarian host when it is missing. I kept local separate database settings and used DATABASE_URL only for a server, while test runs use the _test database. I used freshly registered players in HTTP tests and finished games at the end when needed.
- Decision I made and why: The host row is created on demand because Render does not run seeders, and live session creation otherwise fails with no librarian host. Tests use freshly registered players instead of changing seeded accounts, and finish games at the end of suites. The stale score-based example unit test was replaced with finish-position ranking and board/game-rule tests. Cost: extra test setup and cleanup, plus separate test state isolation.
- Changes to my design set: none in the ERD; added the server environment keys `DATABASE_URL`, `DB_SSL`, `ADMIN_SCHOOL_ID` and `ADMIN_PASSWORD`.
- What I would explain to a classmate: A unit test with jest.mock replaces repositories, so it tests a service rule without loading or changing a real database. An HTTP test with supertest sends a real request through Express, validation, controllers, services and repositories. The test database is separate and named _test, and global setup rebuilds it so test runs do not use my own data. Helmet adds safe response headers, CORS limits browser access to listed origins, and trust proxy tells Express that a server proxy placed before the API is one hop away.
- AI tools: GitHub Copilot agent mode implemented this milestone from the user-provided guide.

## M5 · API documentation and deployment
- Dates worked: Nov 21, 2026 · Time spent: 7 hours
- Goal: Document every implemented endpoint accurately as OpenAPI 3.x, expose Swagger UI, enable documentation tests, and prepare the API for SE1 review.
- What I built: Updated `src/docs/openapi.yaml` with 29 operations and exact component schemas, shared parameters and reusable error responses; added account, user, question-set, question, session and gameplay documentation; enabled `tests/api/docs.api.test.js`; and updated the package, changelog and README. Added Render Blueprint deployment instructions, with `start:render` running migrations and creating the first admin without seeders; documented the free plan's sleep, database expiry and non-persistent uploads; and explained how to verify health and begin with an empty live database.
- Evidence: https://github.com/joyboyy23/quizladder-api/pull/9 and https://github.com/joyboyy23/quizladder-api/pull/10 · 4d86ad1 feat(docs): document all 29 operations with schemas and error codes; c0809dd chore(docs): enable the docs API test; 2c58b94 docs(readme): add live API link, check badge and Deploying to Render section
- Problem I hit: The starter specification contained stray YAML keys that are invalid as OpenAPI description fragments, plus stale Akalat Arena/game/card/password examples and a school-ID pattern that disagreed with the validator.
- How I solved it: I moved fragment text into valid descriptions, removed the stray keys, and checked routes, controllers, validators and services before changing examples or schemas. I used the real QuizLadder game values, `^[A-Z0-9]{3,6}-[0-9]{3,5}$`, `Libro-2026`, and actual response fields and error codes.
- Decision I made and why: Gameplay operations are grouped under the `Gameplay` tag so lobby and player management remain under `Sessions`; test-only dice and event overrides are documented and explicitly described as ignored in production.
- Changes to my design set: none.
- What I would explain to a classmate: I learned that an OpenAPI spec describes each path and verb, including its inputs and possible responses. In this repo, `/results` uses `hubKey` because the Library Game Hub sends the `X-Hub-Key` header. `/question-sets` uses `bearerAuth`, so callers need a login token. Swagger UI turns this spec into a page where I can try documented endpoints.
- AI tools: GitHub Copilot agent mode implemented this milestone from a plan written with Claude.

## M6 · The SE1 portfolio and the release
- Dates worked: Nov 22, 2026 · Time spent: 6 hours
- Goal: Document the system as built, so another developer can use and continue it.
- What I built: docs/technical-spec.md, docs/data-dictionary.md (generated by npm run docs:dictionary), docs/api-reference.md (generated by npm run docs:api), docs/user-guide.md, docs/se2-handoff.md, six PlantUML diagrams in docs/diagrams/, README and CHANGELOG updates, version 1.6.0.
- Evidence: https://github.com/joyboyy23/quizladder-api/pull/11 · fd36d26 chore: add docs scripts and bump version to 1.6.0; c0e81b2 docs: generate data dictionary and API reference
- Problem I hit: The package version was already 1.5.0, so the module's v1.0.0 tag would have gone backwards. Also, Newman first showed all 163 requests failing because the API was not running.
- How I solved it: I bumped the version to 1.6.0 and will tag v1.6.0 so package.json, the changelog and the tag agree. For Newman I reset the database with npm run db:reset, started the API, and reran; 163 requests and 324 assertions passed with 0 failed.
- Decision I made and why: I generated the data dictionary and API reference from the database and OpenAPI file so they cannot disagree with the code. The cost is that I must rerun the scripts after every migration or OpenAPI change.
- Changes to my design set: The six diagrams were redrawn to match what is built (users.password_hash, players.user_id, question_sets.owner_id and cover_picture, questions.position, and the gameplay-state columns on game_sessions).
- What I would explain to a classmate: The server, not the client, rolls the dice and measures the clock. Anything the client sends can be edited, so those choices stay on the server.
- AI tools: I used Claude to plan the milestone and write the PlantUML for the diagrams, and GitHub Copilot to draft the document descriptions. I reviewed and edited them against the code.

## M7 · The Test Report
