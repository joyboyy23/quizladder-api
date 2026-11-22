# API reference: QuizLadder API 1.5.0

Generated from `src/docs/openapi.yaml` by `npm run docs:api`. Base URL: `/api/v1`. Try every endpoint in Swagger UI at `/api/v1/docs/`.

Every error answers `{ "error": { "code": "...", "message": "..." } }`. "Login" means the header `Authorization: Bearer <token>`.

## Hub Contract

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| GET | `/health` | Check API and database health | nothing | 200, 503 |
| GET | `/game-info` | Get Hub game card information | nothing | 200 |
| GET | `/results` | Get finished games for the Library Game Hub | X-Hub-Key | 200, 400, 401 |

## Accounts

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| POST | `/auth/register` | Register a PLAYER account | nothing | 201, 400, 409 |
| POST | `/auth/login` | Log in and receive a bearer token | nothing | 200, 400, 401 |
| GET | `/auth/me` | Get the current account | login | 200, 401 |

## Users

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| GET | `/users` | List all accounts | login | 200, 401, 403 |
| PATCH | `/users/{id}/role` | Change an account role | login | 200, 400, 401, 403, 404, 409 |

## Question Sets

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| GET | `/question-sets` | Search and page question sets | login | 200, 400, 401, 403 |
| POST | `/question-sets` | Create a question set | login | 201, 400, 401, 403, 409 |
| GET | `/question-sets/{id}` | Get a question set | login | 200, 400, 401, 403, 404 |
| PATCH | `/question-sets/{id}` | Rename a question set | login | 200, 400, 401, 403, 404, 409 |
| DELETE | `/question-sets/{id}` | Delete an unused question set | login | 204, 400, 401, 403, 404, 409 |
| PUT | `/question-sets/{id}/cover` | Upload or replace a question-set cover | login | 200, 400, 401, 403, 404, 413 |

## Sessions

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| POST | `/sessions` | Create a game lobby | login | 201, 400, 401, 403, 404 |
| GET | `/sessions/{code}` | Get a lobby or game session | nothing | 200, 400, 404 |
| PATCH | `/sessions/{code}` | Change a session status | login | 200, 400, 401, 403, 404, 409 |
| GET | `/sessions/{code}/players` | List seated players | nothing | 200, 400, 404 |
| POST | `/sessions/{code}/players` | Join or rejoin a session | login | 200, 201, 400, 401, 404, 409 |

## Gameplay

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| GET | `/sessions/{code}/state` | Get live game state | nothing | 200, 400, 404 |
| POST | `/sessions/{code}/roll` | Roll and resolve the current turn | login | 200, 400, 401, 403, 404, 409 |
| GET | `/sessions/{code}/question` | Get the pending question | login | 200, 400, 401, 403, 404, 409 |
| POST | `/sessions/{code}/answers` | Answer the pending question | login | 200, 400, 401, 403, 404, 409 |
| POST | `/sessions/{code}/punish` | Punish another unfinished player | login | 200, 400, 401, 403, 404, 409 |
| GET | `/sessions/{code}/leaderboard` | Get the session leaderboard | nothing | 200, 400, 404 |

## Questions

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| GET | `/question-sets/{id}/questions` | List questions in a set | login | 200, 400, 401, 403, 404 |
| POST | `/question-sets/{id}/questions` | Add a question to a set | login | 201, 400, 401, 403, 404, 409 |
| PATCH | `/question-sets/{id}/questions/{questionId}` | Replace or edit a question | login | 200, 400, 401, 403, 404, 409 |
| DELETE | `/question-sets/{id}/questions/{questionId}` | Delete a question | login | 204, 400, 401, 403, 404, 409 |

