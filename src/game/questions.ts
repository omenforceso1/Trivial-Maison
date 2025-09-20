import rawData from "../../assets/questions.json";
import type { Category, Question, Space } from "./types";

interface RawQuestion {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
}

interface RawCategory {
  id: string;
  name: string;
  color: string;
  questions: RawQuestion[];
}

type QuestionsFile = {
  categories: RawCategory[];
};

const parsed = rawData as QuestionsFile;

export const categories: Category[] = parsed.categories.map((category) => ({
  id: category.id,
  name: category.name,
  color: category.color
}));

export function createBoardSpaces(): Space[] {
  const laps = 4;
  const board: Space[] = [];

  for (let lap = 0; lap < laps; lap += 1) {
    parsed.categories.forEach((category) => {
      board.push({
        index: board.length,
        categoryId: category.id,
        isWedge: lap === 0
      });
    });
  }

  return board;
}

export function createQuestionDeck(): Record<string, Question[]> {
  return parsed.categories.reduce<Record<string, Question[]>>(
    (accumulator, category) => {
      accumulator[category.id] = category.questions.map((question) => ({
        ...question,
        categoryId: category.id
      }));
      return accumulator;
    },
    {}
  );
}

export type CategoryWithQuestions = RawCategory & {
  questions: (RawQuestion & { categoryId: string })[];
};

export const categoriesWithQuestions: CategoryWithQuestions[] =
  parsed.categories.map((category) => ({
    ...category,
    questions: category.questions.map((question) => ({
      ...question,
      categoryId: category.id
    }))
  }));
