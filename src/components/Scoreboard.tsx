import type { Category, PlayerState } from "../game/types";

interface ScoreboardProps {
  players: PlayerState[];
  categories: Category[];
  currentPlayerId?: string;
}

export function Scoreboard({
  players,
  categories,
  currentPlayerId
}: ScoreboardProps) {
  return (
    <section className="panel" aria-label="Scoreboard">
      <h2>Players</h2>
      <div className="player-list">
        {players.map((player) => {
          const isActive = player.id === currentPlayerId;

          return (
            <article
              key={player.id}
              className={`player-card${isActive ? " active" : ""}`}
              aria-label={`${player.name} score card`}
            >
              <div className="score-row">
                <strong>{player.name}</strong>
                <span className="badge">Score: {player.score}</span>
              </div>
              <div className="turn-info" role="list" aria-label="Wedges collected">
                {categories.map((category) => {
                  const hasWedge = player.wedges.includes(category.id);
                  return (
                    <span
                      key={`${player.id}-${category.id}`}
                      className="status-chip"
                      style={{
                        backgroundColor: hasWedge
                          ? `${category.color}22`
                          : "rgba(148, 163, 184, 0.15)",
                        color: hasWedge ? category.color : "#475569"
                      }}
                      role="listitem"
                    >
                      {category.name.split(" ")[0]}
                    </span>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
