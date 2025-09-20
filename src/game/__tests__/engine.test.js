import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialGameState,
  applyRoll,
  answerQuestion,
  proceedToNextTurn,
  resetGame
} from "../engine.js";
import { loadQuestionData, normalizeQuestionData } from "../questions.js";

const rawData = await loadQuestionData();
const questionData = normalizeQuestionData(rawData);

function startGame() {
  return createInitialGameState(["Ada", "Grace"], questionData);
}

test("lancer de dé : question piochée et deck décrémenté", () => {
  const initial = startGame();
  const categoryId = initial.board[1].categoryId;
  const initialDeckSize = initial.questionDeck[categoryId]?.length ?? 0;
  assert.ok(initialDeckSize > 0, "le deck doit contenir des cartes");

  const next = applyRoll(initial, 1);

  assert.ok(next.activeQuestion, "une question doit être active après le lancer");
  assert.equal(next.diceValue, 1);
  assert.equal(next.phase, "question");
  assert.equal(next.questionDeck[categoryId].length, initialDeckSize - 1);
});

test("bonne réponse sur case camembert : gain d'un secteur et score", () => {
  const game = startGame();
  const afterRoll = applyRoll(game, 1);
  assert.ok(afterRoll.activeQuestion, "une question doit être disponible");

  const answer = answerQuestion(afterRoll, afterRoll.activeQuestion.answerIndex);
  const player = answer.players[answer.currentPlayerIndex];

  assert.equal(player.score, 1);
  assert.ok(player.wedges.includes(afterRoll.activeQuestion.categoryId));
  assert.ok(["feedback", "finished"].includes(answer.phase));
});

test("mauvaise réponse puis passage au joueur suivant", () => {
  const game = startGame();
  const afterRoll = applyRoll(game, 2);
  assert.ok(afterRoll.activeQuestion, "une question doit être disponible");

  const wrongIndex = (afterRoll.activeQuestion.answerIndex + 1) % afterRoll.activeQuestion.options.length;
  const feedback = answerQuestion(afterRoll, wrongIndex);
  assert.equal(feedback.phase, "feedback");

  const nextTurn = proceedToNextTurn(feedback);
  assert.equal(nextTurn.currentPlayerIndex, 1);
  assert.equal(nextTurn.phase, "awaiting-roll");
  assert.equal(nextTurn.activeQuestion, undefined);
  assert.equal(nextTurn.diceValue, undefined);
});

test("réinitialiser la partie conserve les noms mais remet les scores à zéro", () => {
  const game = startGame();
  const afterRoll = applyRoll(game, 1);
  const solved = answerQuestion(afterRoll, afterRoll.activeQuestion.answerIndex);
  const names = game.players.map((player) => player.name);

  const reset = resetGame(solved, names, questionData);
  assert.deepEqual(
    reset.players.map((player) => ({ name: player.name, score: player.score, wedges: player.wedges })),
    names.map((name, index) => ({ name, score: 0, wedges: [] }))
  );
  assert.equal(reset.phase, "awaiting-roll");
});
