/**
 * Helpers for loading and normalizing question packs.
 */

/**
 * @typedef {Object} RawQuestion
 * @property {string} id
 * @property {string} prompt
 * @property {string[]} options
 * @property {number} answerIndex
 */

/**
 * @typedef {Object} RawCategory
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {RawQuestion[]} questions
 */

/**
 * @typedef {Object} QuestionsFile
 * @property {RawCategory[]} categories
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} color
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} prompt
 * @property {string[]} options
 * @property {number} answerIndex
 * @property {string} categoryId
 */

/**
 * @typedef {Object} Space
 * @property {number} index
 * @property {string} categoryId
 * @property {boolean} isWedge
 */

/**
 * @typedef {Object} NormalizedQuestionData
 * @property {Category[]} categories
 * @property {Space[]} board
 * @property {Record<string, Question[]>} questionDeck
 */

const QUESTION_FILE_PATH = "../../assets/questions.json";

/**
 * Load the question file both in Node (tests) and in the browser.
 * @returns {Promise<QuestionsFile>}
 */
export async function loadQuestionData() {
  // Browser environment
  if (typeof window !== "undefined" && typeof fetch === "function") {
    const response = await fetch(new URL(QUESTION_FILE_PATH, import.meta.url));
    if (!response.ok) {
      throw new Error(`Unable to load questions: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  // Node environment for tests and scripts
  const [{ readFile }, { dirname, resolve }, { fileURLToPath }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
    import("node:url")
  ]);

  const filePath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    QUESTION_FILE_PATH
  );

  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

/**
 * Expand the trivia packs into board metadata and per-category decks.
 * @param {QuestionsFile} raw
 * @returns {NormalizedQuestionData}
 */
export function normalizeQuestionData(raw) {
  const categories = raw.categories.map((category) => ({
    id: category.id,
    name: category.name,
    color: category.color
  }));

  const laps = 4;
  const board = [];
  for (let lap = 0; lap < laps; lap += 1) {
    for (const category of raw.categories) {
      board.push({
        index: board.length,
        categoryId: category.id,
        isWedge: lap === 0
      });
    }
  }

  const questionDeck = {};
  for (const category of raw.categories) {
    questionDeck[category.id] = category.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: [...question.options],
      answerIndex: question.answerIndex,
      categoryId: category.id
    }));
  }

  return { categories, board, questionDeck };
}

