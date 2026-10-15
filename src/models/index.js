// ONE Sequelize instance (one connection pool) for the whole API.
// Every other file imports it from here - nobody opens a second one.

const { Sequelize, DataTypes } = require('sequelize');
const pg = require('pg');
const env = require('../config/env');

// Timestamp columns have no time zone and hold UTC values. Without this, pg
// reads them as the server's local time and shifts every date.
pg.types.setTypeParser(1114, (value) => new Date(`${value.replace(' ', 'T')}Z`));
const dbConfig = require('../config/database')[env.nodeEnv];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// ============================================================
// 1. LOAD ALL MODELS
// ============================================================

const User = require('./user')(sequelize, DataTypes);
const Host = require('./host')(sequelize, DataTypes);
const QuestionSet = require('./question-set')(sequelize, DataTypes);
const Question = require('./question')(sequelize, DataTypes);
const Answer = require('./answer')(sequelize, DataTypes);
const Board = require('./board')(sequelize, DataTypes);
const Tile = require('./tile')(sequelize, DataTypes);
const GameSession = require('./game-session')(sequelize, DataTypes);
const Player = require('./player')(sequelize, DataTypes);
const Turn = require('./turn')(sequelize, DataTypes);

// ============================================================
// 2. DEFINE MODEL ASSOCIATIONS
// ============================================================

// HOST <-> GAME SESSION
Host.hasMany(GameSession, {
  foreignKey: 'host_id',
  as: 'gameSessions',
});

GameSession.belongsTo(Host, {
  foreignKey: 'host_id',
  as: 'host',
});

// QUESTION SET <-> QUESTION
QuestionSet.hasMany(Question, {
  foreignKey: 'question_set_id',
  as: 'questions',
});

Question.belongsTo(QuestionSet, {
  foreignKey: 'question_set_id',
  as: 'questionSet',
});

// QUESTION <-> ANSWER
Question.hasMany(Answer, {
  foreignKey: 'question_id',
  as: 'answers',
});

Answer.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question',
});

// BOARD <-> TILE
Board.hasMany(Tile, {
  foreignKey: 'board_id',
  as: 'tiles',
});

Tile.belongsTo(Board, {
  foreignKey: 'board_id',
  as: 'board',
});

// QUESTION SET <-> GAME SESSION
QuestionSet.hasMany(GameSession, {
  foreignKey: 'question_set_id',
  as: 'gameSessions',
});

GameSession.belongsTo(QuestionSet, {
  foreignKey: 'question_set_id',
  as: 'questionSet',
});

// BOARD <-> GAME SESSION
Board.hasOne(GameSession, {
  foreignKey: 'board_id',
  as: 'gameSession',
});

GameSession.belongsTo(Board, {
  foreignKey: 'board_id',
  as: 'board',
});

// GAME SESSION <-> PLAYER
GameSession.hasMany(Player, {
  foreignKey: 'session_id',
  as: 'players',
});

Player.belongsTo(GameSession, {
  foreignKey: 'session_id',
  as: 'gameSession',
});

// USER <-> PLAYER
User.hasMany(Player, {
  foreignKey: 'user_id',
  as: 'players',
});

Player.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// GAME SESSION <-> TURN
GameSession.hasMany(Turn, {
  foreignKey: 'session_id',
  as: 'turns',
});

Turn.belongsTo(GameSession, {
  foreignKey: 'session_id',
  as: 'gameSession',
});

// PLAYER <-> TURN
Player.hasMany(Turn, {
  foreignKey: 'player_id',
  as: 'turns',
});

Turn.belongsTo(Player, {
  foreignKey: 'player_id',
  as: 'player',
});

// PLAYER <-> TARGETED TURN EVENT
Player.hasMany(Turn, {
  foreignKey: 'event_target_player_id',
  as: 'targetedEvents',
});

Turn.belongsTo(Player, {
  foreignKey: 'event_target_player_id',
  as: 'targetPlayer',
});

// QUESTION <-> TURN
Question.hasMany(Turn, {
  foreignKey: 'question_id',
  as: 'turns',
});

Turn.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question',
});

// ============================================================
// 3. EXPORT THE INSTANCE AND MODELS
// ============================================================

module.exports = {
  sequelize,
  Sequelize,
  DataTypes,

  User,
  Host,
  QuestionSet,
  Question,
  Answer,
  Board,
  Tile,
  GameSession,
  Player,
  Turn,
};