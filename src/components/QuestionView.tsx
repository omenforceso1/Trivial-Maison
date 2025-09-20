import type { Category, Phase, Question } from "../game/types";

interface QuestionViewProps {
  question?: Question;
  category?: Category;
  phase: Phase;
  diceValue?: number;
  selectedAnswerIndex?: number;
  wasAnswerCorrect?: boolean;
  onSelectAnswer: (index: number) => void;
}

export function QuestionView({
  question,
  category,
  phase,
  diceValue,
  selectedAnswerIndex,
  wasAnswerCorrect,
  onSelectAnswer
}: QuestionViewProps) {
  if (!question) {
    return (
      <section className="panel" aria-label="Awaiting question">
        <h2>Question</h2>
        <p className="turn-info">
          Roll the die to draw a question and move across the board.
        </p>
      </section>
    );
  }

  const isAnswering = phase === "question";
  const isFeedback = phase === "feedback" || phase === "finished";

  return (
    <section className="panel" aria-label="Question prompt">
      <div className="question-card">
        <header>
          <h2>{category?.name ?? "Question"}</h2>
          <div className="turn-info">
            {typeof diceValue === "number" && (
              <span className="badge" aria-label="Dice result">
                Rolled {diceValue}
              </span>
            )}
            {category && (
              <span className="badge" style={{ backgroundColor: `${category.color}22`, color: category.color }}>
                Category: {category.name}
              </span>
            )}
          </div>
        </header>
        <p>{question.prompt}</p>
        <div className="question-options">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswerIndex === index;
            const isCorrectAnswer = question.answerIndex === index;
            const buttonState = isFeedback
              ? isCorrectAnswer
                ? "correct"
                : isSelected
                ? "incorrect"
                : ""
              : "";
            return (
              <button
                key={option}
                type="button"
                className={`option-button${buttonState ? ` ${buttonState}` : ""}`}
                onClick={() => onSelectAnswer(index)}
                disabled={!isAnswering}
              >
                {option}
              </button>
            );
          })}
        </div>
        {isFeedback && (
          <footer className="turn-info">
            {wasAnswerCorrect ? "Correct!" : "Not quite. The correct answer is highlighted."}
          </footer>
        )}
      </div>
    </section>
  );
}
