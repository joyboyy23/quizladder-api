# User guide: QuizLadder API

How each kind of user works with the API. Base URL: https://quizladder-joyboyy23.onrender.com/api/v1. Every endpoint can be tried in Swagger UI at `/docs/`.

## Players

1. Create an account: POST /auth/register. Errors: SCHOOL_ID_TAKEN, EMAIL_TAKEN, VALIDATION_FAILED.
2. Log in and keep the token: POST /auth/login. Error: INVALID_CREDENTIALS.
3. Join a game: POST /sessions/{code}/players with nickname and avatar_color. A new seat gives 201. A rejoin gives 200 with the same seat and position. Errors: SESSION_NOT_JOINABLE, SESSION_ENDED, SESSION_FULL, NICKNAME_TAKEN, AVATAR_COLOR_TAKEN, ALREADY_IN_GAME.
4. Play: read GET /sessions/{code}/state; on your turn POST /sessions/{code}/roll. If the next phase is QUESTION, GET /sessions/{code}/question then POST /sessions/{code}/answers with choice_index. If it is PUNISH, POST /sessions/{code}/punish with target_player_id and amount. Errors: NOT_YOUR_TURN, WRONG_PHASE, NOT_SEATED, ANSWER_TOO_LATE, INVALID_TARGET. Time limits: roll 10 seconds, question 15 seconds, punishment choice 10 seconds.
5. See the leaderboard: GET /sessions/{code}/leaderboard.

A player counts as completed when they land exactly on tile 100 and finished_at is recorded. A move past 100 bounces back.

## Hosts

1. Prepare content: POST /question-sets, then POST /question-sets/{id}/questions with exactly 4 choices and 1 correct one. Optional PUT /question-sets/{id}/cover (PNG or JPEG, up to 1 MB). A set already used by a game is frozen (QUESTION_SET_IN_USE).
2. Start a game: POST /sessions with question_set_id, then share the 6 digit code. The game starts with PATCH /sessions/{code} status PLAYING when 2 to 4 players have joined (NOT_ENOUGH_PLAYERS otherwise).
3. Run it to the end: the game finishes when every player reaches tile 100, or the host sends PATCH /sessions/{code} status FINISHED.

## Admins

Admins use GET /users and PATCH /users/{id}/role to promote hosts. An admin cannot change their own role (CANNOT_CHANGE_OWN_ROLE). The first admin on a new server is created by scripts/create-admin.js from ADMIN_SCHOOL_ID and ADMIN_PASSWORD (password at least 12 characters).

## The Library Game Hub

The Hub calls GET /results with the X-Hub-Key header and optional ?since= (an ISO date and time; a bad value gives INVALID_SINCE). Each finished game lists session_code, started_at, ended_at, every player with school_id, nickname, score and completed, and a podium of the top 3 by rank.

## When something goes wrong

Every error looks like `{ "error": { "code": "...", "message": "..." } }`. Codes a user is most likely to meet: VALIDATION_FAILED (bad input), AUTH_REQUIRED (no login), INVALID_TOKEN (bad or expired token), FORBIDDEN (wrong role), SESSION_NOT_FOUND and QUESTION_SET_NOT_FOUND (missing resource), NOT_SEATED (not in the game), NOT_YOUR_TURN, WRONG_PHASE, ANSWER_TOO_LATE, SESSION_FULL, QUESTION_SET_IN_USE.
