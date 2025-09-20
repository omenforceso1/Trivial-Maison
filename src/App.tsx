import { useMemo, useState } from "react";
import { Board } from "./components/Board";
import { QuestionView } from "./components/QuestionView";
import { Scoreboard } from "./components/Scoreboard";
import { SetupForm } from "./components/SetupForm";
import {
  applyRoll,
  answerQuestion,
  createInitialGameState,
  proceedToNextTurn,
  resetGame,
  rollDie
} from "./game/engine";
import type { Category, GameState } from "./game/types";

const DEFAULT_PLAYERS = ["Alex", "Jordan"];

function useCategories(game: GameState | null): Category[] {
  return useMemo(() => game?.categories ?? [], [game]);
}

export default function App() {
  const [playerNames, setPlayerNames] = useState<string[]>(DEFAULT_PLAYERS);
  const [game, setGame] = useState<GameState | null>(null);

  const categories = useCategories(game);
  const currentPlayer = game ? game.players[game.currentPlayerIndex] : undefined;

  const handleStartGame = () => {
    setGame(createInitialGameState(playerNames));
  };

  const handleRoll = () => {
    if (!game) return;
    const value = rollDie();
    setGame(applyRoll(game, value));
  };

  const handleAnswer = (index: number) => {
    if (!game) return;
    setGame(answerQuestion(game, index));
  };

  const handleNextTurn = () => {
    if (!game) return;
    setGame(proceedToNextTurn(game));
  };

  const handleRestart = () => {
    if (!game) return;
    setGame(resetGame(game, playerNames));
  };

  const handleChangePlayerName = (index: number, value: string) => {
    setPlayerNames((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  };

  const handleAddPlayer = () => {
    setPlayerNames((previous) => [...previous, `Player ${previous.length + 1}`]);
  };

  const handleRemovePlayer = (index: number) => {
    setPlayerNames((previous) => previous.filter((_, i) => i !== index));
  };

  const currentCategory: Category | undefined = useMemo(() => {
    if (!game || !currentPlayer) return undefined;
    const space = game.board[currentPlayer.position];
    return categories.find((category) => category.id === space.categoryId);
  }, [game, currentPlayer, categories]);

  return (
    <div className="app-container">
      <header>
        <h1>Trivial Maison</h1>
        <p>Collect all category wedges before your rivals to win the trivia crown.</p>
      </header>
      <main>
        {!game && (
          <SetupForm
            playerNames={playerNames}
            onUpdatePlayerName={handleChangePlayerName}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onStartGame={handleStartGame}
          />
        )}
        {game && (
          <>
            <Scoreboard
              players={game.players}
              categories={categories}
              currentPlayerId={currentPlayer?.id}
            />
            <Board
              spaces={game.board}
              players={game.players}
              categories={categories}
              currentPlayerId={currentPlayer?.id}
            />
            <section className="panel" aria-label="Turn controls">
              <h2>Turn</h2>
              {currentPlayer && (
                <p className="turn-info">
                  <strong>{currentPlayer.name}</strong> is up.
                </p>
              )}
              <div className="turn-controls">
                <button
                  type="button"
                  className="button"
                  onClick={handleRoll}
                  disabled={game.phase !== "awaiting-roll"}
                >
                  Roll Die
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={handleNextTurn}
                  disabled={game.phase !== "feedback"}
                >
                  Next Turn
                </button>
                <button type="button" className="button" onClick={handleRestart}>
                  Restart Round
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => setGame(null)}
                >
                  Change Players
                </button>
              </div>
              <p className="turn-info">
                Phase: <strong>{game.phase}</strong>
                {typeof game.diceValue === "number" && ` · Last roll: ${game.diceValue}`}
              </p>
              {game.phase === "finished" && game.winnerId && (
                <p className="turn-info">
                  🎉 {game.players.find((player) => player.id === game.winnerId)?.name} collected
                  all wedges and wins the game!
                </p>
              )}
            </section>
            <QuestionView
              question={game.activeQuestion}
              category={currentCategory}
              phase={game.phase}
              diceValue={game.diceValue}
              selectedAnswerIndex={game.selectedAnswerIndex}
              wasAnswerCorrect={game.wasAnswerCorrect}
              onSelectAnswer={handleAnswer}
            />
          </>
        )}
      </main>
      <footer>
        Sample questions are bundled in <code>assets/questions.json</code>. Add more categories or
        questions there, restart the dev server, and the new content will load automatically.
      </footer>
    </div>
  );
}
