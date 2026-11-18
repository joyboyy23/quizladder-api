# QuizLadder API

Backend API for QuizLadder, a tournament game for the SorSU Bulan Campus library.
CS 313 Software Engineering 1, A.Y. 2026-2027.

- Developer: Joenilo F. Estillero (joyboyy23), BSCS 3-1
- Group and game concept: Team 8, QuizLadder

This is my own build of my group's game concept. Every commit in this repository was made by me, with Git, on my own computer or in my own Codespace.

## Tech stack

| Layer | Tool |
|---|---|
| Runtime | Node.js 22 LTS or newer |
| Web framework | Express 5 |
| Database | PostgreSQL 16 or newer |
| ORM and migrations | Sequelize 6 with sequelize-cli |

## Setup

```
git clone https://github.com/joyboyy23/quizladder-api.git
cd quizladder-api
npm install
```

Copy `.env.example` to `.env`, then put your own PostgreSQL password in `DB_PASSWORD`.

```
npm run db:create     (first time only)
npm run db:migrate
npm run db:seed
npm run db:check
npm run dev
```

## Environment variables

| Key | Example | Purpose |
|---|---|---|
| NODE_ENV | development | Which config block to use |
| PORT | 3001 | Port the API listens on (the library assigns the final port at deployment) |
| DB_HOST | 127.0.0.1 | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | quizladder1 | Database name: your game slug, with underscores |
| DB_USER | postgres | Database user |
| DB_PASSWORD | (your own) | Database password. Never commit this. |
| HUB_API_KEY | dev-hub-key | Key the Library Game Hub sends to read results. The library gives the real one at deployment. |

## Endpoints (Hub Contract v1.2)

Base URL: `http://localhost:3001/api/v1`

| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | /health | Is the API up and can it reach the database? | 200 (503 when the database is down) |
| GET | /game-info | Slug, name, group, developer, description, player limits, version | 200 |
| GET | /results | Finished games, every player, and the top 3. Needs the `X-Hub-Key` header. Optional `?since=` | 200 (401 without the key) |

To test `/results` locally (for example in Postman), add the request header `X-Hub-Key: dev-hub-key`. A plain browser visit cannot send it, so it always gets 401.

## Authentication

Register and log in through `/auth/register` and `/auth/login`. Send the returned token as `Authorization: Bearer <token>` on protected requests. Question-set routes require a HOST or ADMIN account.

## Module 1 endpoints (question sets)

HOST and ADMIN accounts can read question sets. The creator or an ADMIN can change a set.

| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | /question-sets | List sets (`page`, `limit`, `q`, `sort`, `order`) | 200 `{ data, meta }` |
| POST | /question-sets | Create a set (`name` 3–100 chars) | 201 |
| GET | /question-sets/:id | Read one set; `?include=questions` includes questions and choices | 200 |
| PATCH | /question-sets/:id | Rename a set (owner or ADMIN) | 200 |
| DELETE | /question-sets/:id | Delete an unused set and its questions (owner or ADMIN) | 204 |

Rules worth knowing:

- Players get `403 FORBIDDEN`.
- Set names are unique: a duplicate returns `409 NAME_TAKEN`.
- Only the owner or an ADMIN can change a set; sets without an owner are ADMIN-only.
- A set used by a game cannot be deleted or have its questions changed: `409 QUESTION_SET_IN_USE`. Renaming and changing its cover remain allowed.
- Responses use a public `id` field (not the internal `question_set_id`).

## Question bank endpoints (Milestone M2)

| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | /question-sets?page&limit&q&sort&order | Search, sort and page through sets | 200 `{ data, meta }` |
| GET | /question-sets/:id?include=questions | Read a set with its questions and choices | 200 |
| GET / POST | /question-sets/:id/questions | List or add questions and choices | 200 / 201 |
| PATCH / DELETE | /question-sets/:id/questions/:questionId | Edit or remove a question | 200 / 204 |
| PUT | /question-sets/:id/cover | Upload or replace a set cover | 200 |

Questions have exactly four choices and exactly one correct answer. The server assigns each question's position. A set holds at most 100 questions. PNG and JPEG covers are limited to 1 MB and are renamed by the server.

Question sets, questions and covers may be changed only by the owner or an ADMIN. A set used in a game is frozen for question edits and deletion. Errors include `QUESTION_NOT_FOUND`, `QUESTION_SET_IN_USE`, `QUESTION_LIMIT_REACHED`, `INVALID_FILE_TYPE`, `FILE_TOO_LARGE` and `COVER_REQUIRED`.

Postman uploads use files under `postman/fixtures/`; set the working directory to the repository root so the collection can find them.

## Module 2 endpoints (sessions and players)

| Method | Path | Purpose | Success |
|---|---|---|---|
| POST | /sessions | A HOST or ADMIN starts a lobby (`WAITING`), server makes a six-digit `code` | 201 |
| GET | /sessions/:code | Read a game by join code | 200 |
| PATCH | /sessions/:code | Set `status` to `PLAYING` or `FINISHED` (HOST or ADMIN) | 200 |
| POST | /sessions/:code/players | Join a lobby, or rejoin an existing seat | 201 new / 200 rejoin |
| GET | /sessions/:code/players | List seats ordered by board position | 200 |

Request bodies:

- **POST /sessions:** `{ "question_set_id": 1 }` — server picks the join `code`, starts as `WAITING`, and creates a board. Clients cannot choose the code.
- **PATCH /sessions/:code:** `{ "status": "PLAYING" }` or `{ "status": "FINISHED" }` — required; an empty body returns `400 VALIDATION_FAILED`.
- **POST /sessions/:code/players:** `{ "nickname": "Bea", "avatar_color": "BLUE" }` — `avatar_color` is one of `RED`, `BLUE`, `GREEN`, `YELLOW`.

Rules worth knowing:

- `session_id` never leaves the API. Join responses use `rejoined` and board `position` (there is no `score` field).
- One game at a time: an account seated in another `PLAYING` game gets `409 ALREADY_IN_GAME` when joining a *new* lobby. Rejoining their own seat still works (`200`, same `player_id` / `position`).
- Soft capacity is 4 players (`game-info.max_players`). Nickname and avatar color must be unique inside a session.
- Closing a game sets `FINISHED` and `finished_at`, so it appears in `/results`.

## Milestone M3 gameplay

| Method | Path | Who may call it | Purpose |
|---|---|---|---|
| PATCH | /sessions/:code | HOST or ADMIN | Start with 2–4 seated players, or end the game manually |
| GET | /sessions/:code/state | Public | Read current turn, timer, and player positions |
| POST | /sessions/:code/roll | Seated current player | Roll the server-side die and resolve the landing tile |
| GET | /sessions/:code/question | Current player | Read the pending question and four choices |
| POST | /sessions/:code/answers | Current player | Answer the pending question with `choice_index` 1–4 |
| POST | /sessions/:code/punish | Current player | Choose another unfinished player and a deduction of 1–6 |
| GET | /sessions/:code/leaderboard?limit=10 | Public | Read finishers first, then unfinished players by position |

Gameplay requests that change the game run in a database transaction and lock the game session. The state and leaderboard reads also process one expired phase timeout lazily; there are no background timers. A roll phase lasts 10 seconds and skips the turn without moving the player, a question phase lasts 15 seconds and moves the player back 3, and an expired punishment-choice phase ends the turn with no effect. The next phase timer begins when the timeout is processed.

The server rolls a six-sided die. `dice` (1–6) and `event` (`QUESTION` or `PUNISHMENT`) may be supplied to `POST /roll` only as test overrides outside production; production ignores these fields. Event boxes activate only when dice movement lands directly on them. A question's correct answer moves the player forward 2, a wrong answer back 2, and the question response never includes `is_correct`. After question or punishment movement, snakes and ladders are applied. A punishment target moves back by the chosen amount (floor 1), then snake/ladder movement is checked for that target too.

Players finish only by landing exactly on tile 100; movement past 100 bounces backward. Finished players stop taking turns, and the session becomes `FINISHED` only after every player finishes (a HOST or ADMIN may still end it manually). The leaderboard orders finishers by `finish_position`; unfinished players have no rank.

Gameplay errors include `409 GAME_NOT_PLAYING`, `NOT_YOUR_TURN`, `WRONG_PHASE`, `NOT_ENOUGH_PLAYERS`, `ANSWER_TOO_LATE` and `INVALID_TARGET`; an account without a seat receives `403 NOT_SEATED`. Invalid request fields receive `400 VALIDATION_FAILED`.

The merged `postman/QuizLadder.postman_collection.json` includes a **Play a whole game** folder with deterministic non-production dice/event scenarios.

Demo school IDs for Postman (`postman/QuizLadder.postman_collection.json`), after a fresh `npm run db:reset`:

| Header | Account | Useful for |
|---|---|---|
| `FAC-0042` | Faye Bautista (HOST) | Create / start / finish sessions (also seated in PLAYING `735104`) |
| `2023-00456` | Ben Reyes | Clean join of a new lobby |
| `2023-00789` / `2024-00111` | Carla / Dino | Extra free joiners (only in FINISHED `482913`) |
| `2023-00123` | Ana Dela Cruz | In PLAYING `735104` — one-game + rejoin tests |
| `2024-00222` | Eli Gonzales | Also in PLAYING `735104` (not a free joiner) |

## What "completed" means in my game

A player has completed the game when they land exactly on tile 100 on the Snakes and Ladders board (a roll that goes past 100 bounces back) and their `finished_at` timestamp is recorded. The game session is marked as `FINISHED` when all players have finished, or when the host ends the game.

Every player who finishes scores 100, because they landed exactly on tile 100. Their rank is the order they reached it: the first to land on tile 100 is rank 1, the second is rank 2, and so on. Players who did not finish have no rank and score their final board position.

## Tables

1. `users` (library accounts, from Design Change Notice 01)
2. `hosts`
3. `question_sets`
4. `questions`
5. `answers`
6. `boards`
7. `tiles`
8. `game_sessions`
9. `players` (one seat per account per game: `UNIQUE (session_id, user_id)`)
10. `turns`

## Demo data

`npm run db:reset` runs the migrations and all seeders:

- 7 users (including the demo admin), 1 host (`librarian`), and the "Library Basics", "Research Skills" and "Citation Rules" question sets. All three are owned by FAC-0042 (Faye); seeded questions have positions and four choices each.
- Game `482913` (FINISHED): AnaReads, BookwormBen and CarlaQuiz reached tile 100 exactly; DinoDice stopped on tile 87
- Game `735104` (PLAYING): three players still on the board, including AnaReads again (one seat per account per game)

## Database scripts

| Command | What it does |
|---|---|
| npm run db:migrate | Runs migrations that have not run yet |
| npm run db:migrate:status | Lists every migration as up or down |
| npm run db:seed | Loads the seed data |
| npm run db:check | Counts the rows in every table |
| npm run db:reset | Empties the database, rebuilds every table and reloads the seed data |
| npm run check | Runs the same automatic check that GitHub runs after every push |
