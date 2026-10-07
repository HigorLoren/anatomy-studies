import { allBlanksFilled } from "../../answerBlanks";
import { QuizActions } from "../molecules/QuizActions";
import { AnswerFeedback } from "../molecules/AnswerFeedback";
import { SelectionFeedback } from "../molecules/SelectionFeedback";
import { MarkerPicker } from "../molecules/MarkerPicker";
import { QuestionInput } from "../molecules/QuestionInput";
import { type Question } from "../../questions";
import type { ViewerStatus } from "../../viewer";

type QuizFormProps = {
  total: number;
  free?: boolean;
  answer: string;
  checked: boolean;
  correct: boolean;
  index: number;
  question: Question;
  status: ViewerStatus;
  onAdvance: () => void;
  onAnswer: (answer: string) => void;
  onCheck: () => void;
  onSkip: () => void;
};

export function QuizForm({
  total,
  free,
  answer,
  checked,
  correct,
  index,
  question,
  status,
  onAdvance,
  onAnswer,
  onCheck,
  onSkip,
}: QuizFormProps) {
  const identify = question.kind === "identify";
  const complete = isWrittenQuestion(question);
  const viewerReady = status === "ready";
  const canSubmit = checked || (allBlanksFilled(question, answer) && (complete || viewerReady));
  const hint = checked
    ? complete
      ? "Leia a explicação antes de continuar, se quiser."
      : "Observe o modelo antes de continuar, se quiser."
    : complete
      ? "Sem pressa. Pense no termo anatômico antes de responder."
      : "Sem pressa. Explore o modelo antes de responder.";

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (checked) onAdvance();
          else if (canSubmit) onCheck();
        }}
      >
        {identify ? (
          <MarkerPicker
            markers={question.markers}
            answer={answer}
            disabled={checked || !viewerReady}
            onSelect={onAnswer}
          />
        ) : (
          <QuestionInput
            answer={answer}
            checked={checked}
            question={question}
            questionIndex={index}
            viewerReady={viewerReady}
            onAnswer={onAnswer}
          />
        )}
        {identify && (
          <SelectionFeedback
            answer={answer}
            checked={checked}
            correct={correct}
          />
        )}
        <AnswerFeedback
          answer={answer}
          checked={checked}
          question={question}
        />
        <QuizActions {...{ checked, index, total, free, canSubmit, onSkip }} />
      </form>
      <p class="mt-4 text-xs leading-5 text-muted">{hint}</p>
    </>
  );
}

function isWrittenQuestion(question: Question) {
  return question.kind !== "identify" && !question.model && !question.highlight;
}
