import type { Category, PlayerState, Space } from "../game/types";

const PLAYER_COLORS = [
  "#2563eb",
  "#9333ea",
  "#16a34a",
  "#f97316",
  "#facc15",
  "#ec4899"
];

interface BoardProps {
  spaces: Space[];
  players: PlayerState[];
  categories: Category[];
  currentPlayerId?: string;
}

export function Board({
  spaces,
  players,
  categories,
  currentPlayerId
}: BoardProps) {
  const categoryLookup = new Map(categories.map((category) => [category.id, category]));
  const playerColorMap = new Map(
    players.map((player, index) => [player.id, PLAYER_COLORS[index % PLAYER_COLORS.length]])
  );

  return (
    <section className="panel" aria-label="Game board">
      <h2>Board</h2>
      <div className="board-grid">
        {spaces.map((space) => {
          const occupyingPlayers = players.filter(
            (player) => player.position === space.index
          );
          const isActiveSpace = occupyingPlayers.some(
            (player) => player.id === currentPlayerId
          );
          const category = categoryLookup.get(space.categoryId);

          return (
            <div
              key={space.index}
              className={`board-space${space.isWedge ? " wedge" : ""}${
                isActiveSpace ? " active" : ""
              }`}
              style={{
                borderColor: category?.color ?? "#cbd5f5"
              }}
              role="group"
              aria-label={`${category?.name ?? "Space"} space ${
                space.isWedge ? "(wedge)" : ""
              }`}
            >
              <strong>{category?.name ?? space.categoryId}</strong>
              <span className="badge">#{space.index + 1}</span>
              <div aria-label="Player tokens on this space">
                {occupyingPlayers.map((player) => {
                  const color = playerColorMap.get(player.id) ?? "#2563eb";
                  return (
                    <span
                      key={player.id}
                      className="player-token"
                      style={{ backgroundColor: color }}
                      title={player.name}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
