# Data dictionary

Generated from the database by `npm run docs:dictionary` on 2026-11-22, then described by hand.

### `answers`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `answer_id` | bigint | no | auto number | ; PK | Primary key identifying one multiple-choice answer option. |
| `question_id` | bigint | no |  | ; FK REFERENCES questions(question_id) ON UPDATE CASCADE ON DELETE RESTRICT; UNIQUE (answers_question_id_choice_index_unique) | Question this choice belongs to. |
| `choice_index` | integer | no |  | ; UNIQUE (answers_question_id_choice_index_unique); CHECK (answers_choice_index_check) | Choice number from 1 to 4 for this question. |
| `answer_text` | text | no |  |  | Display text of this answer choice. |
| `is_correct` | boolean | no | `false` |  | True when this choice is the correct answer. |

### `boards`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `board_id` | bigint | no | auto number | ; PK | Primary key identifying one 100-tile game board. |
| `size` | integer | no | `100` | ; CHECK (boards_size_check) | Number of tiles on the board, always 100. |

### `game_sessions`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `session_id` | bigint | no | auto number | ; PK | Primary key identifying one multiplayer game session. |
| `host_id` | bigint | no |  | ; FK REFERENCES hosts(host_id) ON UPDATE CASCADE ON DELETE RESTRICT | Host record that owns this session. |
| `question_set_id` | bigint | no |  | ; FK REFERENCES question_sets(question_set_id) ON UPDATE CASCADE ON DELETE RESTRICT | Question set used for Event Box questions in this game. |
| `board_id` | bigint | no |  | ; UNIQUE (game_sessions_board_id_key); FK REFERENCES boards(board_id) ON UPDATE CASCADE ON DELETE RESTRICT | Board assigned exclusively to this session. |
| `join_code` | character(6) | no |  | ; UNIQUE (game_sessions_join_code_key) | Unique six-digit code players use to join. |
| `status` | character varying(20) | no | `'WAITING'` | ; CHECK (game_sessions_status_check) | Session lifecycle: WAITING, PLAYING, or FINISHED. |
| `created_at` | timestamp without time zone | no | `CURRENT_TIMESTAMP` |  | When the session was created. |
| `started_at` | timestamp without time zone | yes |  |  | When play started; empty until the host starts. |
| `finished_at` | timestamp without time zone | yes |  |  | When all players finished; empty until then. |
| `current_player_id` | bigint | yes |  | FK REFERENCES players(player_id) ON UPDATE CASCADE ON DELETE RESTRICT | Player whose turn it is; empty when not playing. |
| `turn_phase` | character varying(20) | yes |  | CHECK (game_sessions_turn_phase_check) | Current phase ROLL, QUESTION, or PUNISH while playing. |
| `phase_started_at` | timestamp with time zone | yes |  |  | When the current phase timer began. |
| `pending_question_id` | bigint | yes |  | FK REFERENCES questions(question_id) ON UPDATE CASCADE ON DELETE RESTRICT | Question awaiting an answer during the QUESTION phase. |
| `turn_number` | integer | no | `0` |  | Count of turns completed so far in this session. |

### `hosts`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `host_id` | bigint | no | auto number | ; PK | Primary key identifying a host account. |
| `username` | character varying(50) | no |  | ; UNIQUE (hosts_username_key) | Unique name for the host record. |
| `password_hash` | character varying(255) | no |  |  | Stored password value; API login uses users instead. |
| `created_at` | timestamp without time zone | no | `CURRENT_TIMESTAMP` |  | When this host account was created. |

### `players`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `player_id` | bigint | no | auto number | ; PK | Primary key identifying one seated player in a session. |
| `session_id` | bigint | no |  | ; FK REFERENCES game_sessions(session_id) ON UPDATE CASCADE ON DELETE RESTRICT; UNIQUE (players_session_id_nickname_unique); UNIQUE (players_session_id_avatar_color_unique); UNIQUE (players_session_id_user_id_unique) | Game session this player seat belongs to. |
| `nickname` | character varying(30) | no |  | ; UNIQUE (players_session_id_nickname_unique) | Display name unique within the session. |
| `avatar_color` | character varying(10) | no |  | ; UNIQUE (players_session_id_avatar_color_unique); CHECK (players_avatar_color_check) | Token color RED, BLUE, GREEN, or YELLOW unique per session. |
| `position` | integer | no | `1` | ; CHECK (players_position_check) | Current tile number from 1 to 100. |
| `finish_position` | integer | yes |  | CHECK (players_finish_position_check) | Order the player reached tile 100; empty until they finish. |
| `finished_at` | timestamp without time zone | yes |  |  | When the player reached tile 100; empty until then. |
| `joined_at` | timestamp without time zone | no | `CURRENT_TIMESTAMP` |  | When the player joined this session. |
| `user_id` | bigint | no |  | ; FK REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT; UNIQUE (players_session_id_user_id_unique) | Logged-in user occupying this seat. |

### `question_sets`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `question_set_id` | bigint | no | auto number | ; PK | Primary key identifying one quiz pack. |
| `name` | character varying(100) | no |  | ; UNIQUE (question_sets_name_key) | Unique display name of the question set. |
| `created_at` | timestamp without time zone | no | `CURRENT_TIMESTAMP` |  | When the question set was created. |
| `owner_id` | bigint | yes |  | FK REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT | User who owns this set; null for shared sets. |
| `cover_picture` | character varying(255) | yes |  |  | Filename of the uploaded cover image, if any. |

### `questions`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `question_id` | bigint | no | auto number | ; PK | Primary key identifying one quiz question. |
| `question_set_id` | bigint | no |  | ; FK REFERENCES question_sets(question_set_id) ON UPDATE CASCADE ON DELETE RESTRICT; UNIQUE (questions_question_set_id_position_unique) | Question set this question belongs to. |
| `question_text` | text | no |  |  | Prompt text shown to the player. |
| `position` | integer | yes |  | UNIQUE (questions_question_set_id_position_unique); CHECK (questions_position_check) | Display order within the set, unique per set. |

### `tiles`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `tile_id` | bigint | no | auto number | ; PK | Primary key identifying one square on a board. |
| `board_id` | bigint | no |  | ; FK REFERENCES boards(board_id) ON UPDATE CASCADE ON DELETE RESTRICT; UNIQUE (tiles_board_id_tile_number_unique) | Board this tile belongs to. |
| `tile_number` | integer | no |  | ; UNIQUE (tiles_board_id_tile_number_unique); CHECK (tiles_tile_number_check) | Square number from 1 to 100 on the board. |
| `tile_type` | character varying(20) | no |  | ; CHECK (tiles_tile_type_check) | Square kind: NORMAL, EVENT, SNAKE, or LADDER. |
| `destination_tile` | integer | yes |  | CHECK (tiles_destination_tile_check) | Snake or ladder exit tile; empty for other types. |

### `turns`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `turn_id` | bigint | no | auto number | ; PK | Primary key identifying one recorded turn. |
| `session_id` | bigint | no |  | ; FK REFERENCES game_sessions(session_id) ON UPDATE CASCADE ON DELETE RESTRICT; UNIQUE (turns_session_id_turn_number_unique) | Game session this turn belongs to. |
| `player_id` | bigint | no |  | ; FK REFERENCES players(player_id) ON UPDATE CASCADE ON DELETE RESTRICT | Player who took this turn. |
| `turn_number` | integer | no |  | ; UNIQUE (turns_session_id_turn_number_unique) | Sequential turn index within the session. |
| `dice_result` | integer | yes |  | CHECK (turns_dice_result_check) | Dice face from 1 to 6; empty if the roll timed out. |
| `event_type` | character varying(20) | no | `'NONE'` | ; CHECK (turns_event_type_check) | Event triggered: NONE, QUESTION, or PUNISHMENT. |
| `event_target_player_id` | bigint | yes |  | FK REFERENCES players(player_id) ON UPDATE CASCADE ON DELETE RESTRICT | Player punished during a PUNISHMENT event. |
| `event_amount` | integer | yes |  | CHECK (turns_event_amount_check) | Tile change from the event, from -6 to 2. |
| `question_id` | bigint | yes |  | FK REFERENCES questions(question_id) ON UPDATE CASCADE ON DELETE RESTRICT | Question asked if the event was QUESTION. |
| `started_at` | timestamp without time zone | no |  |  | When this turn began. |
| `ended_at` | timestamp without time zone | yes |  |  | When this turn ended; empty while still open. |

### `users`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `user_id` | bigint | no | auto number | ; PK | Primary key identifying one account. |
| `school_id` | character varying(20) | no |  | ; UNIQUE (users_school_id_key) | Unique campus ID used to log in. |
| `full_name` | character varying(100) | no |  |  | Student's or staff member's display name. |
| `email` | character varying(255) | no |  | ; UNIQUE (users_email_key) | Unique email address for the account. |
| `role` | character varying(20) | no | `'PLAYER'` | ; CHECK (users_role_check) | Account role PLAYER, HOST, or ADMIN. |
| `created_at` | timestamp with time zone | no | `CURRENT_TIMESTAMP` |  | When the account was registered. |
| `password_hash` | character varying(60) | yes |  |  | bcrypt hash of the password; never returned by the API. |
