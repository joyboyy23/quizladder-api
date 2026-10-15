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

## What "completed" means in my game

A player has completed the game when they land exactly on tile 100 on the Snakes and Ladders board (a roll that goes past 100 bounces back) and their `finished_at` timestamp is recorded. The game session is marked as `FINISHED` when the top 3 players have finished, or when the host ends the game.

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

`npm run db:seed` loads `db/seeders/20261014130000-demo-data.js`:

- 6 users, 1 host (`librarian`), and the "Library Basics" question set (5 questions with 4 answers each)
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
