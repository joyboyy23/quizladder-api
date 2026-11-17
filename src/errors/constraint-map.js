// A database rule was broken -> what the client should hear.
// The key is the constraint name from YOUR migration. PostgreSQL names a
// foreign key "<table>_<column>_fkey" when the migration does not name it.
module.exports = {
  users_school_id_key: {
    status: 409,
    code: 'SCHOOL_ID_TAKEN',
    message: 'An account with that school ID already exists.',
    },
    users_email_key: {
    status: 409,
    code: 'EMAIL_TAKEN',
    message: 'An account with that email address already exists.',
  },
  question_sets_name_key: {
    status: 409,
    code: 'NAME_TAKEN',
    message: 'A question set with that name already exists.',
  },
  questions_question_set_id_position_unique: {
    status: 409,
    code: 'POSITION_CONFLICT',
    message: 'Another request added a question at the same moment. Try again.',
  },
  game_sessions_question_set_id_fkey: {
    status: 409,
    code: 'QUESTION_SET_IN_USE',
    message: 'This question set was used in a game and cannot be deleted.',
  },
  questions_question_set_id_fkey: {
    status: 409,
    code: 'QUESTION_SET_IN_USE',
    message: 'This question set was used in a game and cannot be deleted.',
  },
  players_session_id_nickname_unique: {
    status: 409,
    code: 'NICKNAME_TAKEN',
    message: 'That nickname is already used in this game.',
  },
  players_session_id_avatar_color_unique: {
    status: 409,
    code: 'AVATAR_COLOR_TAKEN',
    message: 'That avatar color is already used in this game.',
  },
};
