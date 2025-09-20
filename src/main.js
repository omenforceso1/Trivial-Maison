import {
  createInitialGameState,
  applyRoll,
  answerQuestion,
  proceedToNextTurn,
  resetGame,
  rollDie
} from "./game/engine.js";
import { loadQuestionData, normalizeQuestionData } from "./game/questions.js";

const DEFAULT_PLAYERS = ["Alex", "Jordan"];
const PLAYER_COLORS = [
  "#2563eb",
  "#9333ea",
  "#16a34a",
  "#f97316",
  "#facc15",
  "#ec4899"
];
const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;

let playerNames = [...DEFAULT_PLAYERS];
let gameState = null;
let questionData = null;
let loadingError = null;

const mainElement = document.getElementById("main");
const appContainer = document.getElementById("app");

function render() {
  if (!questionData && !loadingError) {
    mainElement.innerHTML = "";
    const loadingSection = document.createElement("section");
    loadingSection.className = "panel";
    loadingSection.innerHTML = "<h2>Chargement…</h2><p>Préparation du plateau et des questions.</p>";
    mainElement.appendChild(loadingSection);
    return;
  }

  if (loadingError) {
    mainElement.innerHTML = "";
    const errorSection = document.createElement("section");
    errorSection.className = "panel";
    const message = document.createElement("p");
    message.className = "turn-info";
    message.textContent = loadingError.message || "Impossible de charger les questions.";
    errorSection.appendChild(document.createElement("h2")).textContent = "Erreur";
    errorSection.appendChild(message);
    mainElement.appendChild(errorSection);
    return;
  }

  if (!gameState) {
    renderSetupView();
    return;
  }

  renderGameView();
}

function renderSetupView() {
  mainElement.innerHTML = "";
  const section = document.createElement("section");
  section.className = "panel";
  section.setAttribute("aria-label", "Configuration des joueurs");

  const heading = document.createElement("h2");
  heading.textContent = "Joueurs";
  section.appendChild(heading);

  const form = document.createElement("form");
  form.className = "player-setup";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!questionData) return;
    gameState = createInitialGameState(playerNames, questionData);
    render();
  });

  const inputsWrapper = document.createElement("div");
  inputsWrapper.className = "player-inputs";

  playerNames.forEach((name, index) => {
    const label = document.createElement("label");

    const caption = document.createElement("span");
    caption.textContent = `Joueur ${index + 1}`;
    label.appendChild(caption);

    const row = document.createElement("div");
    row.className = "input-row";

    const input = document.createElement("input");
    input.type = "text";
    input.required = true;
    input.minLength = 1;
    input.value = name;
    input.placeholder = `Nom du joueur ${index + 1}`;
    input.addEventListener("input", (event) => {
      const value = event.target.value;
      playerNames = playerNames.map((existing, i) => (i === index ? value : existing));
    });
    row.appendChild(input);

    if (playerNames.length > MIN_PLAYERS) {
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "button danger";
      removeButton.setAttribute("aria-label", `Supprimer le joueur ${index + 1}`);
      removeButton.textContent = "✕";
      removeButton.addEventListener("click", () => {
        playerNames = playerNames.filter((_, i) => i !== index);
        render();
      });
      row.appendChild(removeButton);
    }

    label.appendChild(row);
    inputsWrapper.appendChild(label);
  });

  form.appendChild(inputsWrapper);

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "add-player-button";
  addButton.textContent = "+ Ajouter un joueur";
  addButton.disabled = playerNames.length >= MAX_PLAYERS;
  addButton.addEventListener("click", () => {
    if (playerNames.length >= MAX_PLAYERS) return;
    playerNames = [...playerNames, `Joueur ${playerNames.length + 1}`];
    render();
  });
  form.appendChild(addButton);

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "button";
  submitButton.textContent = "Lancer la partie";
  form.appendChild(submitButton);

  section.appendChild(form);
  mainElement.appendChild(section);
}

function renderGameView() {
  mainElement.innerHTML = "";
  mainElement.appendChild(createScoreboardSection());
  mainElement.appendChild(createBoardSection());
  mainElement.appendChild(createTurnSection());
  mainElement.appendChild(createQuestionSection());
}

function createScoreboardSection() {
  const section = document.createElement("section");
  section.className = "panel";
  section.setAttribute("aria-label", "Tableau des scores");

  const heading = document.createElement("h2");
  heading.textContent = "Scores";
  section.appendChild(heading);

  const list = document.createElement("div");
  list.className = "player-list";

  gameState.players.forEach((player) => {
    const card = document.createElement("article");
    card.className = "player-card";
    if (player.id === getCurrentPlayer()?.id) {
      card.classList.add("active");
    }

    const nameRow = document.createElement("div");
    nameRow.className = "score-row";

    const name = document.createElement("strong");
    name.textContent = player.name;
    nameRow.appendChild(name);

    const score = document.createElement("span");
    score.className = "badge";
    score.textContent = `Score : ${player.score}`;
    nameRow.appendChild(score);

    card.appendChild(nameRow);

    const wedgeList = document.createElement("div");
    wedgeList.className = "turn-info";
    wedgeList.setAttribute("role", "list");

    gameState.categories.forEach((category) => {
      const chip = document.createElement("span");
      chip.className = "status-chip";
      const hasWedge = player.wedges.includes(category.id);
      chip.textContent = category.name.split(" ")[0];
      chip.style.backgroundColor = hasWedge
        ? `${category.color}22`
        : "rgba(148, 163, 184, 0.15)";
      chip.style.color = hasWedge ? category.color : "#475569";
      chip.setAttribute("role", "listitem");
      wedgeList.appendChild(chip);
    });

    card.appendChild(wedgeList);
    list.appendChild(card);
  });

  section.appendChild(list);
  return section;
}

function createBoardSection() {
  const section = document.createElement("section");
  section.className = "panel";
  section.setAttribute("aria-label", "Plateau de jeu");

  const heading = document.createElement("h2");
  heading.textContent = "Plateau";
  section.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "board-grid";

  const currentPlayerId = getCurrentPlayer()?.id;
  const playerColorMap = new Map(
    gameState.players.map((player, index) => [player.id, PLAYER_COLORS[index % PLAYER_COLORS.length]])
  );

  gameState.board.forEach((space) => {
    const tile = document.createElement("div");
    tile.className = "board-space";
    if (space.isWedge) {
      tile.classList.add("wedge");
    }

    const occupyingPlayers = gameState.players.filter(
      (player) => player.position === space.index
    );

    if (occupyingPlayers.some((player) => player.id === currentPlayerId)) {
      tile.classList.add("active");
    }

    const category = gameState.categories.find((cat) => cat.id === space.categoryId);
    if (category) {
      tile.style.borderColor = category.color;
    }

    const label = document.createElement("strong");
    label.textContent = category ? category.name : space.categoryId;
    tile.appendChild(label);

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `#${space.index + 1}`;
    tile.appendChild(badge);

    const tokenWrap = document.createElement("div");
    tokenWrap.setAttribute("aria-label", "Pions sur cette case");
    tokenWrap.className = "token-row";

    occupyingPlayers.forEach((player) => {
      const token = document.createElement("span");
      token.className = "player-token";
      token.textContent = player.name.charAt(0).toUpperCase();
      token.title = player.name;
      token.style.backgroundColor = playerColorMap.get(player.id) ?? "#2563eb";
      tokenWrap.appendChild(token);
    });

    tile.appendChild(tokenWrap);
    grid.appendChild(tile);
  });

  section.appendChild(grid);
  return section;
}

function createTurnSection() {
  const section = document.createElement("section");
  section.className = "panel";
  section.setAttribute("aria-label", "Contrôles du tour");

  const heading = document.createElement("h2");
  heading.textContent = "Tour";
  section.appendChild(heading);

  const currentPlayer = getCurrentPlayer();
  if (currentPlayer) {
    const info = document.createElement("p");
    info.className = "turn-info";
    info.innerHTML = `<strong>${currentPlayer.name}</strong> doit jouer.`;
    section.appendChild(info);
  }

  const controls = document.createElement("div");
  controls.className = "turn-controls";

  const rollButton = document.createElement("button");
  rollButton.type = "button";
  rollButton.className = "button";
  rollButton.textContent = "Lancer le dé";
  rollButton.disabled = gameState.phase !== "awaiting-roll";
  rollButton.addEventListener("click", () => {
    const value = rollDie();
    gameState = applyRoll(gameState, value);
    render();
  });
  controls.appendChild(rollButton);

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "button";
  nextButton.textContent = "Tour suivant";
  nextButton.disabled = gameState.phase !== "feedback";
  nextButton.addEventListener("click", () => {
    gameState = proceedToNextTurn(gameState);
    render();
  });
  controls.appendChild(nextButton);

  const restartButton = document.createElement("button");
  restartButton.type = "button";
  restartButton.className = "button";
  restartButton.textContent = "Recommencer";
  restartButton.addEventListener("click", () => {
    gameState = resetGame(gameState, playerNames, questionData);
    render();
  });
  controls.appendChild(restartButton);

  const changeButton = document.createElement("button");
  changeButton.type = "button";
  changeButton.className = "button";
  changeButton.textContent = "Changer les joueurs";
  changeButton.addEventListener("click", () => {
    playerNames = gameState.players.map((player) => player.name);
    gameState = null;
    render();
  });
  controls.appendChild(changeButton);

  section.appendChild(controls);

  const phaseInfo = document.createElement("p");
  phaseInfo.className = "turn-info";
  const parts = [`Phase : ${gameState.phase}`];
  if (typeof gameState.diceValue === "number") {
    parts.push(`Dernier lancer : ${gameState.diceValue}`);
  }
  phaseInfo.textContent = parts.join(" · ");
  section.appendChild(phaseInfo);

  if (gameState.phase === "finished" && gameState.winnerId) {
    const winner = gameState.players.find((player) => player.id === gameState.winnerId);
    if (winner) {
      const banner = document.createElement("p");
      banner.className = "turn-info";
      banner.innerHTML = `🎉 <strong>${winner.name}</strong> remporte la partie en collectant toutes les camemberts !`;
      section.appendChild(banner);
    }
  }

  return section;
}

function createQuestionSection() {
  const section = document.createElement("section");
  section.className = "panel";
  section.setAttribute("aria-label", "Question en cours");

  const card = document.createElement("div");
  card.className = "question-card";

  const heading = document.createElement("h2");
  heading.textContent = "Question";
  card.appendChild(heading);

  if (!gameState.activeQuestion) {
    const info = document.createElement("p");
    info.className = "turn-info";
    info.textContent = "Lancez le dé pour piocher une nouvelle question.";
    card.appendChild(info);
    section.appendChild(card);
    return section;
  }

  const question = gameState.activeQuestion;
  const category = gameState.categories.find((cat) => cat.id === question.categoryId);

  if (category) {
    const badges = document.createElement("div");
    badges.className = "turn-info";

    const categoryBadge = document.createElement("span");
    categoryBadge.className = "badge";
    categoryBadge.style.backgroundColor = `${category.color}22`;
    categoryBadge.style.color = category.color;
    categoryBadge.textContent = `Catégorie : ${category.name}`;
    badges.appendChild(categoryBadge);

    if (typeof gameState.diceValue === "number") {
      const rollBadge = document.createElement("span");
      rollBadge.className = "badge";
      rollBadge.textContent = `Dé : ${gameState.diceValue}`;
      badges.appendChild(rollBadge);
    }

    card.appendChild(badges);
  }

  const prompt = document.createElement("p");
  prompt.textContent = question.prompt;
  card.appendChild(prompt);

  const optionsWrapper = document.createElement("div");
  optionsWrapper.className = "question-options";

  const isAnswering = gameState.phase === "question";
  const isFeedback = gameState.phase === "feedback" || gameState.phase === "finished";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.textContent = option;
    button.disabled = !isAnswering;

    if (isFeedback) {
      if (index === question.answerIndex) {
        button.classList.add("correct");
      } else if (index === gameState.selectedAnswerIndex) {
        button.classList.add("incorrect");
      }
    }

    button.addEventListener("click", () => {
      gameState = answerQuestion(gameState, index);
      render();
    });

    optionsWrapper.appendChild(button);
  });

  card.appendChild(optionsWrapper);

  if (isFeedback) {
    const feedback = document.createElement("footer");
    feedback.className = "turn-info";
    feedback.textContent = gameState.wasAnswerCorrect
      ? "Bonne réponse !"
      : "Mauvaise réponse. La bonne option est mise en évidence.";
    card.appendChild(feedback);
  }

  section.appendChild(card);
  return section;
}

function getCurrentPlayer() {
  if (!gameState) return null;
  return gameState.players[gameState.currentPlayerIndex];
}

async function bootstrap() {
  try {
    const raw = await loadQuestionData();
    questionData = normalizeQuestionData(raw);
  } catch (error) {
    console.error(error);
    loadingError = error instanceof Error ? error : new Error("Chargement impossible");
  } finally {
    render();
  }
}

render();
bootstrap();

// Improve touch / pointer interactions on the whole container.
if (appContainer) {
  appContainer.addEventListener("pointerup", () => {
    appContainer.classList.remove("is-pressing");
  });
  appContainer.addEventListener("pointerdown", () => {
    appContainer.classList.add("is-pressing");
  });
}
