const { randomInt } = require('node:crypto');
const env = require('../config/env');
const sessionRepository = require('../repositories/session.repository');
const playerRepository = require('../repositories/player.repository');
const turnRepository = require('../repositories/turn.repository');
const questionRepository = require('../repositories/question.repository');
const { applyMove, nextActive, pickEvent } = require('../lib/game-rules');
const { tileTypeOf, destinationOf } = require('../lib/board-layout');
const { AppError, notFound, conflict } = require('../errors/app-error');

const PHASE_SECONDS = { ROLL: 10, QUESTION: 15, PUNISH: 10 };

function playerIdEquals(a, b) {
  return a !== null && a !== undefined
    && b !== null && b !== undefined
    && BigInt(a) === BigInt(b);
}

function phaseSecondsLeft(session, now) {
  if (!session.turn_phase || !session.phase_started_at) return 0;
  const elapsed = now.getTime() - new Date(session.phase_started_at).getTime();
  return Math.max(0, Math.ceil((PHASE_SECONDS[session.turn_phase] * 1000 - elapsed) / 1000));
}

async function inGameplayTransaction(code, action) {
  let deferredError;
  const result = await sessionRepository.transaction(async (transaction) => {
    const session = await sessionRepository.lockByCode(code, transaction);
    if (!session) throw notFound('SESSION_NOT_FOUND', `No game has the code ${code}.`);
    const now = new Date();
    const timeout = await applyExpiredTimeout(session, now, transaction);
    if (!timeout.applied) return action(session, transaction, now, timeout);

    try {
      return await sessionRepository.transaction(
        (savepoint) => action(session, savepoint, now, timeout),
        { transaction }
      );
    } catch (error) {
      deferredError = error;
      return null;
    }
  });
  if (deferredError) throw deferredError;
  return result;
}

function requirePlaying(session) {
  if (session.status !== 'PLAYING') {
    throw conflict('GAME_NOT_PLAYING', 'This game is not currently being played.');
  }
}

async function requireSeat(session, userId, transaction) {
  const player = await playerRepository.findSeat(
    session.session_id,
    userId,
    { transaction }
  );
  if (!player) {
    throw new AppError(403, 'NOT_SEATED', 'You must be seated in this game to play.');
  }
  return player;
}

function requireCurrentPlayer(session, player) {
  if (!playerIdEquals(session.current_player_id, player.player_id)) {
    throw conflict('NOT_YOUR_TURN', 'It is not your turn.');
  }
}

function requirePhase(session, phase) {
  if (session.turn_phase !== phase) {
    throw conflict('WRONG_PHASE', `This action is only allowed during the ${phase} phase.`);
  }
}

async function getCurrentPlayer(session, transaction) {
  if (session.current_player_id === null) return null;
  return playerRepository.findByPlayerId(
    session.session_id,
    session.current_player_id,
    { transaction }
  );
}

async function markFinishedIfNeeded(session, player, position, now, transaction) {
  const changes = { position };
  let finished = false;
  if (position === 100 && player.finished_at === null) {
    changes.finished_at = now;
    changes.finish_position = (await playerRepository.countFinishedBySession(
      session.session_id,
      { transaction }
    )) + 1;
    finished = true;
  }
  await playerRepository.update(player, changes, { transaction });
  if (finished) await finishSessionIfComplete(session, now, transaction);
  return finished;
}

async function finishSessionIfComplete(session, now, transaction) {
  const playerCount = await playerRepository.countBySession(
    session.session_id,
    { transaction }
  );
  const finishedCount = await playerRepository.countFinishedBySession(
    session.session_id,
    { transaction }
  );
  if (playerCount > 0 && playerCount === finishedCount) {
    await sessionRepository.update(session, {
      status: 'FINISHED',
      finished_at: now,
      current_player_id: null,
      turn_phase: null,
      phase_started_at: null,
      pending_question_id: null,
    }, { transaction });
    return true;
  }
  return false;
}

async function moveTo(session, player, landing, now, transaction) {
  const tileType = tileTypeOf(landing);
  const snakeOrLadderTo = destinationOf(landing);
  const position = snakeOrLadderTo || landing;
  const finished = await markFinishedIfNeeded(session, player, position, now, transaction);
  return { position, tileType, snakeOrLadderTo, finished };
}

async function moveByEffect(session, player, amount, now, transaction) {
  const landing = applyMove(player.position, amount);
  return moveTo(session, player, landing, now, transaction);
}

async function advanceTurn(session, currentPlayerId, now, transaction) {
  if (session.status === 'FINISHED') return null;
  const players = await playerRepository.listByPlayerId(
    session.session_id,
    { transaction }
  );
  const next = nextActive(players, currentPlayerId);
  if (!next) {
    await finishSessionIfComplete(session, now, transaction);
    return null;
  }
  await sessionRepository.update(session, {
    current_player_id: next.player_id,
    turn_phase: 'ROLL',
    phase_started_at: now,
    pending_question_id: null,
  }, { transaction });
  return 'ROLL';
}

async function endTurn(session, turn, playerId, now, transaction) {
  await turnRepository.update(turn, { ended_at: now }, transaction);
  await sessionRepository.update(session, { pending_question_id: null }, { transaction });
  if (await finishSessionIfComplete(session, now, transaction)) return null;
  return advanceTurn(session, playerId, now, transaction);
}

async function applyExpiredTimeout(session, now, transaction) {
  if (session.status !== 'PLAYING' || !session.turn_phase || !session.phase_started_at) {
    return { applied: false };
  }
  const elapsed = now.getTime() - new Date(session.phase_started_at).getTime();
  if (elapsed < PHASE_SECONDS[session.turn_phase] * 1000) {
    return { applied: false };
  }

  const expiredPhase = session.turn_phase;
  const player = await getCurrentPlayer(session, transaction);
  if (!player) throw new Error('A playing session has no current player.');

  if (expiredPhase === 'ROLL') {
    const turnNumber = session.turn_number + 1;
    await turnRepository.create({
      session_id: session.session_id,
      player_id: player.player_id,
      turn_number: turnNumber,
      dice_result: null,
      event_type: 'NONE',
      event_target_player_id: null,
      event_amount: null,
      question_id: null,
      started_at: session.phase_started_at,
      ended_at: now,
    }, transaction);
    await sessionRepository.update(session, { turn_number: turnNumber }, { transaction });
    await advanceTurn(session, player.player_id, now, transaction);
  } else {
    const turn = await turnRepository.findOpenBySession(session.session_id, transaction);
    if (!turn) throw new Error('An event phase has no open turn.');
    if (expiredPhase === 'QUESTION') {
      await moveByEffect(session, player, -3, now, transaction);
      await turnRepository.update(turn, { event_amount: -3 }, transaction);
    } else {
      await turnRepository.update(turn, { event_amount: 0 }, transaction);
    }
    await endTurn(session, turn, player.player_id, now, transaction);
  }

  return {
    applied: true,
    phase: expiredPhase,
    playerId: player.player_id,
  };
}

async function getState(code) {
  return inGameplayTransaction(code, async (session, transaction, now) => {
    const players = await playerRepository.listByPlayerId(
      session.session_id,
      { transaction }
    );
    const currentPlayer = players.find((player) =>
      playerIdEquals(player.player_id, session.current_player_id)
    );
    return {
      status: session.status,
      current_player: currentPlayer
        ? {
          player_id: Number(currentPlayer.player_id),
          nickname: currentPlayer.nickname,
        }
        : null,
      turn_phase: session.turn_phase,
      seconds_left: phaseSecondsLeft(session, now),
      server_time: now.toISOString(),
      players: players.map((player) => ({
        player_id: Number(player.player_id),
        nickname: player.nickname,
        avatar_color: player.avatar_color,
        position: player.position,
        finish_position: player.finish_position,
      })),
    };
  });
}

async function chooseQuestion(session, transaction) {
  const askedIds = await turnRepository.findAskedQuestionIds(session.session_id, transaction);
  let questions = await questionRepository.findAllForGame(
    session.question_set_id,
    askedIds,
    transaction
  );
  if (questions.length === 0) {
    questions = await questionRepository.findAllForGame(
      session.question_set_id,
      [],
      transaction
    );
  }
  if (questions.length === 0) {
    throw conflict('QUESTION_UNAVAILABLE', 'This game has no questions available.');
  }
  return questions[randomInt(0, questions.length)];
}

async function roll(code, userId, overrides = {}) {
  return inGameplayTransaction(code, async (session, transaction, now, timeout) => {
    requirePlaying(session);
    const player = await requireSeat(session, userId, transaction);
    requireCurrentPlayer(session, player);
    if (timeout.applied
      && timeout.phase === 'ROLL'
      && playerIdEquals(timeout.playerId, player.player_id)) {
      throw conflict('WRONG_PHASE', 'The previous turn timed out.');
    }
    requirePhase(session, 'ROLL');

    const dice = env.nodeEnv !== 'production' && overrides.dice !== undefined
      ? overrides.dice
      : randomInt(1, 7);
    const from = player.position;
    const landing = applyMove(from, dice);
    const tileType = tileTypeOf(landing);
    const eventType = tileType === 'EVENT'
      ? (env.nodeEnv !== 'production' && overrides.event ? overrides.event : pickEvent())
      : 'NONE';
    const question = eventType === 'QUESTION'
      ? await chooseQuestion(session, transaction)
      : null;
    const turnNumber = session.turn_number + 1;
    const turn = await turnRepository.create({
      session_id: session.session_id,
      player_id: player.player_id,
      turn_number: turnNumber,
      dice_result: dice,
      event_type: eventType,
      event_target_player_id: null,
      event_amount: null,
      question_id: question ? question.question_id : null,
      started_at: now,
      ended_at: null,
    }, transaction);
    await sessionRepository.update(session, { turn_number: turnNumber }, { transaction });

    let to = landing;
    let snakeOrLadderTo = null;
    let finished = false;
    let nextPhase;
    if (eventType !== 'NONE') {
      await playerRepository.update(player, { position: landing }, { transaction });
      nextPhase = eventType === 'QUESTION' ? 'QUESTION' : 'PUNISH';
      await sessionRepository.update(session, {
        turn_phase: nextPhase,
        phase_started_at: now,
        pending_question_id: question ? question.question_id : null,
      }, { transaction });
    } else {
      const movement = await moveTo(session, player, landing, now, transaction);
      to = movement.position;
      snakeOrLadderTo = movement.snakeOrLadderTo;
      finished = movement.finished;
      await turnRepository.update(turn, { ended_at: now }, transaction);
      nextPhase = await advanceTurn(session, player.player_id, now, transaction);
    }

    return {
      dice,
      from,
      to,
      tile_type: tileType,
      snake_or_ladder_to: snakeOrLadderTo,
      finished,
      next_phase: nextPhase,
    };
  });
}

async function getQuestion(code, userId) {
  return inGameplayTransaction(code, async (session, transaction, now) => {
    requirePlaying(session);
    const player = await requireSeat(session, userId, transaction);
    requireCurrentPlayer(session, player);
    requirePhase(session, 'QUESTION');
    const question = await questionRepository.findInSet(
      session.question_set_id,
      session.pending_question_id,
      { transaction }
    );
    if (!question) throw new Error('The pending question is missing.');
    return {
      question_id: Number(question.question_id),
      question: question.question_text,
      choices: question.answers.map((answer) => ({
        choice_index: answer.choice_index,
        text: answer.answer_text,
      })),
      seconds_left: phaseSecondsLeft(session, now),
    };
  });
}

async function answer(code, userId, choiceIndex) {
  return inGameplayTransaction(code, async (session, transaction, now, timeout) => {
    if (timeout.applied && timeout.phase === 'QUESTION') {
      throw conflict('ANSWER_TOO_LATE', 'The answer deadline has passed.');
    }
    requirePlaying(session);
    const player = await requireSeat(session, userId, transaction);
    requireCurrentPlayer(session, player);
    requirePhase(session, 'QUESTION');
    const turn = await turnRepository.findOpenBySession(session.session_id, transaction);
    if (!turn) throw new Error('The question phase has no open turn.');
    const question = await questionRepository.findInSet(
      session.question_set_id,
      session.pending_question_id,
      { transaction }
    );
    if (!question) throw new Error('The pending question is missing.');
    const selected = question.answers.find((choice) => choice.choice_index === choiceIndex);
    const correct = Boolean(selected && selected.is_correct);
    const amount = correct ? 2 : -2;
    const from = player.position;
    const movement = await moveByEffect(session, player, amount, now, transaction);
    await turnRepository.update(turn, { event_amount: amount }, transaction);
    const nextPhase = await endTurn(session, turn, player.player_id, now, transaction);
    return {
      correct,
      from,
      to: movement.position,
      finished: movement.finished,
      next_phase: nextPhase,
    };
  });
}

async function punish(code, userId, targetPlayerId, amount) {
  return inGameplayTransaction(code, async (session, transaction, now, timeout) => {
    requirePlaying(session);
    const player = await requireSeat(session, userId, transaction);
    requireCurrentPlayer(session, player);
    if (timeout.applied) {
      throw conflict('WRONG_PHASE', 'The previous punishment phase timed out.');
    }
    requirePhase(session, 'PUNISH');
    const target = await playerRepository.findByPlayerId(
      session.session_id,
      targetPlayerId,
      { transaction }
    );
    if (!target || playerIdEquals(target.player_id, player.player_id) || target.finished_at !== null) {
      throw conflict('INVALID_TARGET', 'Choose another unfinished player in this game.');
    }
    const turn = await turnRepository.findOpenBySession(session.session_id, transaction);
    if (!turn) throw new Error('The punishment phase has no open turn.');
    const from = target.position;
    const movement = await moveByEffect(session, target, -amount, now, transaction);
    await turnRepository.update(turn, {
      event_target_player_id: target.player_id,
      event_amount: -amount,
    }, transaction);
    const nextPhase = await endTurn(session, turn, player.player_id, now, transaction);
    return {
      target_player_id: Number(target.player_id),
      from,
      to: movement.position,
      finished: movement.finished,
      next_phase: nextPhase,
    };
  });
}

async function leaderboard(code, limit) {
  return inGameplayTransaction(code, async (session, transaction) => {
    const players = await playerRepository.listByPlayerId(
      session.session_id,
      { transaction }
    );
    players.sort((a, b) => {
      if (a.finish_position !== null && b.finish_position !== null) {
        return a.finish_position - b.finish_position;
      }
      if (a.finish_position !== null) return -1;
      if (b.finish_position !== null) return 1;
      if (a.position !== b.position) return b.position - a.position;
      if (BigInt(a.player_id) < BigInt(b.player_id)) return -1;
      if (BigInt(a.player_id) > BigInt(b.player_id)) return 1;
      return 0;
    });
    return {
      players: players.slice(0, limit).map((player) => ({
        rank: player.finish_position,
        player_id: Number(player.player_id),
        nickname: player.nickname,
        position: player.position,
        finish_position: player.finish_position,
      })),
    };
  });
}

module.exports = {
  getState,
  roll,
  getQuestion,
  answer,
  punish,
  leaderboard,
  applyExpiredTimeout,
};
