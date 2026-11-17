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

## M3 · Gameplay

## M4 · Automated tests and server preparation

## M5 · API documentation and deployment

## M6 · The SE1 portfolio and the release

## M7 · The Test Report
