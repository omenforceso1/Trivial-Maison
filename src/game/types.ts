export interface Question {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Space {
  index: number;
  categoryId: string;
  isWedge: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  position: number;
  wedges: string[];
  score: number;
}

export type Phase =
  | "setup"
  | "awaiting-roll"
  | "question"
  | "feedback"
  | "finished";

export interface GameState {
  players: PlayerState[];
  currentPlayerIndex: number;
  board: Space[];
  categories: Category[];
  questionDeck: Record<string, Question[]>;
  discardPile: Record<string, Question[]>;
  phase: Phase;
  diceValue?: number;
  activeQuestion?: Question;
  wasAnswerCorrect?: boolean;
  selectedAnswerIndex?: number;
  winnerId?: string;
}
