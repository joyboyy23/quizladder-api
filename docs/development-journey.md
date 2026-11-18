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
- Dates worked: Nov 17, 2026 · Time spent: [student writes the hours]
- Goal: Give hosts a question bank: paged lists, nested questions and choices, and a cover upload.
- What I built: migrations `db/migrations/20261117020000-add-owner-and-cover-to-question-sets.js` and `db/migrations/20261117020100-add-position-to-questions.js`; seeders `db/seeders/20261117020200-demo-question-set-owners.js` and `db/seeders/20261117020300-demo-question-positions.js`; ownership, cover and position model fields; `src/lib/cover-files.js`, `src/middlewares/owned-question-set.js`, and the `question.validator`, `question.repository`, `question.service`, and `question.controller` layers; updated question-set layers, session repository, routes and constraint map. Endpoints include paged/searchable `GET /question-sets`, `GET /question-sets/:id?include=questions`, nested question list/create/edit/delete, and `PUT /question-sets/:id/cover`. Updated the Postman collection, README and changelog.
- Evidence: [pull request link: add after opening the PR] · <three real commit hashes from `git log --oneline`>
- Problem I hit: `npm run check` first failed the cover fetch because the pre-request script used the collection's local port 3001 while CI runs the API on port 3099.
- How I solved it: I changed the script to resolve the effective `baseUrl`, then reran the check; all 120 Postman requests and 241 assertions passed.
- Decision I made and why: Question sets have an owner (`owner_id`); only the owner or an ADMIN may change them, and a set used by a game is frozen. Cost: a seeded set needed an owner, so a new seeder assigns Faye.
- Changes to my design set: ERD and data dictionary: `question_sets.owner_id` and `cover_picture`, `questions.position` (UNIQUE with `question_set_id`). Endpoint table: nested question routes, `include=questions`, cover upload.
- What I would explain to a classmate: [student writes this in their own words]
- AI tools: GitHub Copilot (agent mode) implemented this milestone from the user-provided plan PDF.

## M3 · Gameplay
- Dates worked: Nov 17, 2026 · Time spent: [student writes the hours]
- Goal: Implement multiplayer turns, board movement, event choices, timeouts, and finish order using persisted game state.
- What I built: Reversible gameplay-state migration and seeded game setup; pure board/game rules; locked transactional gameplay services and repositories; validated state, roll, question, answer, punishment and leaderboard endpoints; deterministic Postman gameplay scenarios. Updated the README and API documentation for the rules and errors.
- Evidence: [pull request link: add after opening the PR] · <commit hashes from `git log --oneline`>
- Problem I hit: [student writes the problem]
- How I solved it: [student writes the solution]
- Decision I made and why: Gameplay state stays in the database; timeouts are applied lazily under the game-session lock so overlapping rolls cannot advance the same turn twice. Test dice/event overrides are ignored in production.
- Changes to my design set: Added current player, phase, phase start, pending question and turn-number state; added turn-number uniqueness; the session finishes only after all players finish. Added gameplay endpoints and error codes.
- What I would explain to a classmate: [student writes this in their own words]
- AI tools: GitHub Copilot (agent mode) implemented this milestone from the user-provided gameplay requirements.

## M4 · Automated tests and server preparation

## M5 · API documentation and deployment

## M6 · The SE1 portfolio and the release

## M7 · The Test Report
