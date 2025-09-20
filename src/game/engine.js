/**
 * Core game state transitions for Trivial Maison.
 * The functions are pure and return new state objects to keep updates predictable.
 */

import { normalizeQuestionData } from "./questions.js";

/**
 * @typedef {import('./questions.js').NormalizedQuestionData} NormalizedQuestionData
 * @typedef {import('./questions.js').Category} Category
 * @typedef {import('./questions.js').Question} Question
 * @typedef {import('./questions.js').Space} Space
 */

/**
 * @typedef {Object} PlayerState
 * @property {string} id
 * @property {string} name
 * @property {number} position
 * @property {string[]} wedges
 * @property {number} score
 */

/**
 * @typedef {Object} GameState
 * @property {PlayerState[]} players
 * @property {number} currentPlayerIndex
 * @property {Space[]} board
 * @property {Category[]} categories
 * @property {Record<string, Question[]>} questionDeck
 * @property {Record<string, Question[]>} discardPile
 * @property {"awaiting-roll"|"question"|"feedback"|"finished"} phase
 * @property {number | undefined} diceValue
 * @property {Question | undefined} activeQuestion
 * @property {boolean | undefined} wasAnswerCorrect
 * @property {number | undefined} selectedAnswerIndex
 * @property {string | undefined} winnerId
 */

/**
 * Construct player state objects from the provided names.
 * @param {string[]} playerNames
 * @returns {PlayerState[]}
 */
export function createPlayers(playerNames) {
  return playerNames.map((name, index) => ({
    id: `player-${index + 1}`,
    name: name.trim() || `Player ${index + 1}`,
    position: 0,
    wedges: [],
    score: 0
  }));
}

/**
 * Deep clone the deck or discard piles to keep state immutable.
 * @param {Record<string, Question[]>} source
 * @returns {Record<string, Question[]>}
 */
function cloneQuestionMap(source) {
  const copy = {};
  for (const [categoryId, questions] of Object.entries(source)) {
    copy[categoryId] = questions.map((question) => ({ ...question }));
  }
  return copy;
}

/**
 * Create a fresh game state instance based on the provided player names and question data.
 * @param {string[]} playerNames
 * @param {NormalizedQuestionData} data
 * @returns {GameState}
 */
export function createInitialGameState(playerNames, data) {
  const sanitizedNames = playerNames
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  const finalNames = sanitizedNames.length >= 2 ? sanitizedNames : ["Player 1", "Player 2"];

  return {
    players: createPlayers(finalNames),
    currentPlayerIndex: 0,
    board: data.board.map((space) => ({ ...space })),
    categories: data.categories.map((category) => ({ ...category })),
    questionDeck: cloneQuestionMap(data.questionDeck),
    discardPile: Object.fromEntries(
      data.categories.map((category) => [category.id, []])
    ),
    phase: "awaiting-roll",
    diceValue: undefined,
    activeQuestion: undefined,
    wasAnswerCorrect: undefined,
    selectedAnswerIndex: undefined,
    winnerId: undefined
  };
}

/**
 * Roll a standard six-sided die.
 * @param {() => number} [random]
 * @returns {number}
 */
export function rollDie(random = Math.random) {
  const value = Math.floor(random() * 6) + 1;
  if (Number.isNaN(value) || value < 1) return 1;
  if (value > 6) return 6;
  return value;
}

/**
 * Draw the next question for the given category, recycling the discard pile when necessary.
 * @param {GameState} state
 * @param {string} categoryId
 * @returns {{ question: Question; deck: Record<string, Question[]>; discard: Record<string, Question[]>; }}
 */
function drawQuestionFromDeck(state, categoryId) {
  const currentDeck = state.questionDeck[categoryId] ?? [];
  const currentDiscard = state.discardPile[categoryId] ?? [];

  let workingDeck = currentDeck.slice();
  let workingDiscard = currentDiscard.slice();

  if (workingDeck.length === 0) {
    if (workingDiscard.length === 0) {
      throw new Error(`No questions available for category ${categoryId}`);
    }
    workingDeck = workingDiscard;
    workingDiscard = [];
  }

  const [question, ...remainingDeck] = workingDeck;

  return {
    question,
    deck: {
      ...state.questionDeck,
      [categoryId]: remainingDeck
    },
    discard: {
      ...state.discardPile,
      [categoryId]: workingDiscard
    }
  };
}

/**
 * Move the current player, draw a question, and transition to the answering phase.
 * @param {GameState} state
 * @param {number} diceValue
 * @returns {GameState}
 */
export function applyRoll(state, diceValue) {
  if (state.phase !== "awaiting-roll") {
    return state;
  }

  const boardSize = state.board.length;
  const players = state.players.map((player, index) => {
    if (index !== state.currentPlayerIndex) return player;
    const nextPosition = (player.position + diceValue) % boardSize;
    return {
      ...player,
      position: nextPosition
    };
  });

  const currentPlayer = players[state.currentPlayerIndex];
  const space = state.board[currentPlayer.position];
  const { question, deck, discard } = drawQuestionFromDeck(state, space.categoryId);

  return {
    ...state,
    players,
    diceValue,
    questionDeck: deck,
    discardPile: discard,
    activeQuestion: question,
    phase: "question",
    selectedAnswerIndex: undefined,
    wasAnswerCorrect: undefined
  };
}

/**
 * Validate an answer selection and compute scoring / wedge collection.
 * @param {GameState} state
 * @param {number} selectedIndex
 * @returns {GameState}
 */
export function answerQuestion(state, selectedIndex) {
  if (state.phase !== "question" || !state.activeQuestion) {
    return state;
  }

  const question = state.activeQuestion;
  const isCorrect = question.answerIndex === selectedIndex;

  const players = state.players.map((player, index) => {
    if (index !== state.currentPlayerIndex) return player;

    const currentSpace = state.board[player.position];
    const hasWedgeAlready = player.wedges.includes(question.categoryId);

    let nextWedges = player.wedges;
    let nextScore = player.score;

    if (isCorrect) {
      nextScore += 1;
      if (currentSpace.isWedge && !hasWedgeAlready) {
        nextWedges = [...player.wedges, question.categoryId];
      }
    }

    return {
      ...player,
      score: nextScore,
      wedges: nextWedges
    };
  });

  const discardPile = {
    ...state.discardPile,
    [question.categoryId]: [
      ...(state.discardPile[question.categoryId] ?? []),
      question
    ]
  };

  const updatedPlayer = players[state.currentPlayerIndex];
  const hasAllWedges = updatedPlayer.wedges.length === state.categories.length;
  const winnerId = isCorrect && hasAllWedges ? updatedPlayer.id : state.winnerId;

  return {
    ...state,
    players,
    discardPile,
    wasAnswerCorrect: isCorrect,
    selectedAnswerIndex: selectedIndex,
    winnerId,
    phase: winnerId ? "finished" : "feedback"
  };
}

/**
 * Advance the turn order and reset transient data.
 * @param {GameState} state
 * @returns {GameState}
 */
export function proceedToNextTurn(state) {
  if (state.phase !== "feedback") {
    return state;
  }

  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    phase: "awaiting-roll",
    diceValue: undefined,
    activeQuestion: undefined,
    wasAnswerCorrect: undefined,
    selectedAnswerIndex: undefined
  };
}

/**
 * Reset the game while keeping the current roster of player names.
 * @param {GameState} state
 * @param {string[]} playerNames
 * @param {NormalizedQuestionData} data
 * @returns {GameState}
 */
export function resetGame(state, playerNames, data) {
  const fresh = createInitialGameState(playerNames, data);
  return {
    ...fresh,
    players: fresh.players.map((player, index) => ({
      ...player,
      name: playerNames[index] ?? player.name
    }))
  };
}

/**
 * Helper for tests – ensure that the provided data structure is normalized.
 * @param {import('./questions.js').QuestionsFile} raw
 * @param {string[]} playerNames
 * @returns {GameState}
 */
export function createGameFromRawData(raw, playerNames) {
  const normalized = normalizeQuestionData(raw);
  return createInitialGameState(playerNames, normalized);
}
