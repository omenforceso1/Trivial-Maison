# Trivial Maison

A responsive trivia night experience built with React and Vite. The interface adapts to desktop browsers, tablets, and mobile phones, making it easy to play on touch or mouse-driven devices. Players roll a die, move around the digital board, answer category questions, earn wedges, and race to complete their collection first.

## Project structure

```
Trivial-Maison/
├── assets/                # Sample question packs and icons
│   └── questions.json     # Ready-to-edit sample questions
├── src/
│   ├── components/        # React UI components (board, question view, setup, etc.)
│   ├── game/              # Core game state + rules engine
│   │   ├── __tests__/     # Automated unit tests (Vitest)
│   │   └── ...
│   ├── App.tsx            # Main application shell
│   ├── main.tsx           # React entry point
│   ├── styles.css         # Shared styling + responsive layout
│   └── vite-env.d.ts
├── index.html             # Vite HTML template
├── package.json           # Dependencies and scripts
└── vite.config.ts         # Build + test configuration
```

## Getting started

### Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- npm (bundled with Node)

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Vite will output a local URL (typically http://localhost:5173). Open it in a desktop browser, tablet, or phone. The layout automatically adapts to different screen sizes and pointer types.

### Build for production

```bash
npm run build
```

The optimized assets will be emitted to the `dist/` directory. Preview the built bundle with:

```bash
npm run preview
```

### Run automated tests

```bash
npm test
```

Vitest covers critical game rules such as question drawing, scoring, and turn rotation. The suite runs in a JSDOM environment and can be expanded with additional scenarios.

## Gameplay overview

1. Add between two and six player names in the setup screen and start the game.
2. On each turn, a player rolls the die, moves across the board, and draws a question in the landing category.
3. Answer correctly on a wedge space to earn that category’s wedge and increase your score.
4. Incorrect answers end the turn; play passes to the next participant.
5. The first player to collect all wedges wins and can immediately restart a new round.

## Managing questions

Sample data lives in [`assets/questions.json`](./assets/questions.json). Each category contains:

- `id`: unique identifier (used internally)
- `name`: display label
- `color`: accent color for the UI (hex string)
- `questions`: an array of prompts with multiple-choice options and the `answerIndex`

To add more trivia:

1. Duplicate an existing category block or append new questions to a category.
2. Ensure every `answerIndex` matches the zero-based position of the correct option.
3. Save the file and restart the development server (or reload the page during development). The decks automatically refresh.

You can also add new assets (icons, audio cues, etc.) to the `assets/` directory and import them where needed.

## Customizing the experience

- Adjust the board layout or wedge distribution by editing `src/game/questions.ts`.
- Extend the rules engine (e.g., timed rounds, penalties) in `src/game/engine.ts`.
- Refine styles or add themes inside `src/styles.css`.

Feel free to tailor the trivia packs and visuals to match your event or brand.
