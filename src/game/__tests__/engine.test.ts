import { describe, expect, it } from "vitest";
import {
  answerQuestion,
  applyRoll,
  createInitialGameState,
  proceedToNextTurn
} from "../engine";

function startGame() {
  return createInitialGameState(["Ada", "Grace"]);
}

describe("game engine", () => {
  it("draws a question and reduces the deck when a player rolls", () => {
    const initial = startGame();
    const categoryId = initial.board[1].categoryId;
    const initialDeckLength = initial.questionDeck[categoryId]?.length ?? 0;
    expect(initialDeckLength).toBeGreaterThan(0);

    const afterRoll = applyRoll(initial, 1);

    expect(afterRoll.activeQuestion).toBeDefined();
    expect(afterRoll.diceValue).toBe(1);
    expect(afterRoll.phase).toBe("question");
    expect(afterRoll.questionDeck[categoryId]).toHaveLength(initialDeckLength - 1);
  });

  it("awards a wedge and increments score for a correct answer on a wedge space", () => {
    const initial = startGame();
    const afterRoll = applyRoll(initial, 1);
    const question = afterRoll.activeQuestion;
    if (!question) {
      throw new Error("Expected a question to be active");
    }

    const afterAnswer = answerQuestion(afterRoll, question.answerIndex);
    const player = afterAnswer.players[afterAnswer.currentPlayerIndex];

    expect(player.score).toBe(1);
    expect(player.wedges).toContain(question.categoryId);
    expect(["feedback", "finished"]).toContain(afterAnswer.phase);
  });

  it("passes control to the next player after feedback", () => {
    const initial = startGame();
    const afterRoll = applyRoll(initial, 2);
    const question = afterRoll.activeQuestion;
    if (!question) {
      throw new Error("Expected a question to be active");
    }

    const afterAnswer = answerQuestion(afterRoll, (question.answerIndex + 1) % question.options.length);
    expect(afterAnswer.phase).toBe("feedback");

    const nextTurn = proceedToNextTurn(afterAnswer);
    expect(nextTurn.currentPlayerIndex).toBe(1);
    expect(nextTurn.phase).toBe("awaiting-roll");
    expect(nextTurn.activeQuestion).toBeUndefined();
    expect(nextTurn.diceValue).toBeUndefined();
  });
});
