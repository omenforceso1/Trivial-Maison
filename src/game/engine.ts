import { categories, createBoardSpaces, createQuestionDeck } from "./questions";
import type { GameState, PlayerState, Question } from "./types";

export function createPlayers(playerNames: string[]): PlayerState[] {
  return playerNames.map((name, index) => ({
    id: `player-${index + 1}`,
    name: name.trim() || `Player ${index + 1}`,
    position: 0,
    wedges: [],
    score: 0
  }));
}

export function createInitialGameState(playerNames: string[]): GameState {
  const sanitized = playerNames
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  const players = createPlayers(
    sanitized.length > 0 ? sanitized : ["Player 1", "Player 2"]
  );

  const board = createBoardSpaces();
  const questionDeck = createQuestionDeck();
  const discardPile = Object.fromEntries(
    Object.keys(questionDeck).map((categoryId) => [categoryId, [] as Question[]])
  );

  return {
    players,
    currentPlayerIndex: 0,
    board,
    categories,
    questionDeck,
    discardPile,
    phase: "awaiting-roll"
  };
}

export function rollDie(random: () => number = Math.random): number {
  const value = Math.floor(random() * 6) + 1;
  return Math.max(1, Math.min(6, value));
}

function drawQuestionFromDeck(
  state: GameState,
  categoryId: string
): {
  question: Question;
  deck: Record<string, Question[]>;
  discard: Record<string, Question[]>;
} {
  const currentDeck = state.questionDeck[categoryId] ?? [];
  const currentDiscard = state.discardPile[categoryId] ?? [];

  let workingDeck = [...currentDeck];
  let workingDiscard = [...currentDiscard];

  if (workingDeck.length === 0) {
    if (workingDiscard.length === 0) {
      throw new Error(`No questions available for category ${categoryId}`);
    }
    workingDeck = [...workingDiscard];
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

export function applyRoll(state: GameState, diceValue: number): GameState {
  if (state.phase !== "awaiting-roll") {
    return state;
  }

  const boardSize = state.board.length;
  const players = state.players.map((player, index) => {
    if (index !== state.currentPlayerIndex) {
      return player;
    }
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

export function answerQuestion(
  state: GameState,
  selectedIndex: number
): GameState {
  if (state.phase !== "question" || !state.activeQuestion) {
    return state;
  }

  const question = state.activeQuestion;
  const isCorrect = question.answerIndex === selectedIndex;

  const players = state.players.map((player, index) => {
    if (index !== state.currentPlayerIndex) {
      return player;
    }

    let wedges = player.wedges;
    let score = player.score;

    if (isCorrect) {
      score += 1;
      const currentSpace = state.board[player.position];
      const hasWedge = wedges.includes(question.categoryId);
      if (currentSpace.isWedge && !hasWedge) {
        wedges = [...wedges, question.categoryId];
      }
    }

    return {
      ...player,
      wedges,
      score
    };
  });

  const discardPile = {
    ...state.discardPile,
    [question.categoryId]: [
      ...(state.discardPile[question.categoryId] ?? []),
      question
    ]
  };

  const currentPlayer = players[state.currentPlayerIndex];
  const hasAllWedges = currentPlayer.wedges.length === state.categories.length;
  const winnerId = isCorrect && hasAllWedges ? currentPlayer.id : state.winnerId;

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

export function proceedToNextTurn(state: GameState): GameState {
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

export function resetGame(state: GameState, playerNames: string[]): GameState {
  const initial = createInitialGameState(playerNames);
  return {
    ...initial,
    players: initial.players.map((player, index) => ({
      ...player,
      name: playerNames[index] ?? player.name
    }))
  };
}
