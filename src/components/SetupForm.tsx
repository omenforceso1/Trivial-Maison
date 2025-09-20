interface SetupFormProps {
  playerNames: string[];
  onUpdatePlayerName: (index: number, value: string) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (index: number) => void;
  onStartGame: () => void;
}

export function SetupForm({
  playerNames,
  onUpdatePlayerName,
  onAddPlayer,
  onRemovePlayer,
  onStartGame
}: SetupFormProps) {
  return (
    <section className="panel" aria-label="Player setup">
      <h2>Players</h2>
      <form
        className="player-setup"
        onSubmit={(event) => {
          event.preventDefault();
          onStartGame();
        }}
      >
        <div className="player-inputs">
          {playerNames.map((name, index) => (
            <label key={index}>
              <span>Player {index + 1}</span>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => onUpdatePlayerName(index, event.target.value)}
                  placeholder={`Enter name for player ${index + 1}`}
                  required
                  minLength={1}
                />
                {playerNames.length > 2 && (
                  <button
                    type="button"
                    className="button"
                    style={{ background: "#e11d48" }}
                    onClick={() => onRemovePlayer(index)}
                    aria-label={`Remove player ${index + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </label>
          ))}
        </div>
        <button
          type="button"
          className="add-player-button"
          onClick={onAddPlayer}
          disabled={playerNames.length >= 6}
        >
          + Add another player
        </button>
        <button type="submit" className="button">
          Start Game
        </button>
      </form>
    </section>
  );
}
