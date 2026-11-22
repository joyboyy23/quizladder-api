# SE2 handoff: building the QuizLadder frontend

## Connection

| Item | Value |
|---|---|
| Base URL (production) | https://quizladder-joyboyy23.onrender.com/api/v1 |
| Base URL (local) | http://localhost:3001/api/v1 |
| Contract | Hub Contract v1.3; Swagger UI at `/docs/`, `src/docs/openapi.yaml` |
| CORS | Only origins listed in the CORS_ORIGINS setting may read answers in a browser. The default is http://localhost:5173. To use another frontend address, add it to CORS_ORIGINS in the Render dashboard (comma separated) and redeploy. |
| Login | Send POST /auth/login, keep the token in memory or sessionStorage, and send it as "Authorization: Bearer <token>". The token lasts 1 hour and there is no refresh endpoint. On a 401 with code INVALID_TOKEN or AUTH_REQUIRED, delete the token and show the login page. |
| First request | The free Render service sleeps after 15 minutes. The first request can take about a minute. Show a loading message and retry /health. |

## Screens and the endpoints they use

| Screen | Endpoints |
|---|---|
| Login and Register | POST /auth/register, POST /auth/login, GET /auth/me |
| Join a game | POST /sessions/{code}/players, GET /sessions/{code} |
| Lobby | GET /sessions/{code}/players, GET /sessions/{code}/state |
| Board and turn | GET /sessions/{code}/state, POST /sessions/{code}/roll |
| Question | GET /sessions/{code}/question, POST /sessions/{code}/answers |
| Punishment | POST /sessions/{code}/punish |
| Leaderboard | GET /sessions/{code}/leaderboard |
| Host question sets | GET /question-sets, POST /question-sets, POST /question-sets/{id}/questions, PUT /question-sets/{id}/cover |
| Host game control | POST /sessions, PATCH /sessions/{code}, GET /sessions/{code}/players |
| Admin accounts | GET /users, PATCH /users/{id}/role |

## Known limits and the SE2 backlog

1. No websockets, so the frontend must poll GET /sessions/{code}/state and use seconds_left.
2. Uploaded covers disappear when the free Render service restarts.
3. The free database expires on December 21, 2026.
4. Players cannot browse question sets (those routes need HOST or ADMIN).
5. There is no login rate limit and no token refresh.
