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
}: QuizFormProps) {
  const identify = question.kind === "identify";
  const complete = question.kind === "complete";
  const viewerReady = status === "ready";
  const canSubmit = answer.trim() && (complete || viewerReady);
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
          else onCheck();
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
          correct={correct}
          question={question}
        />
        <button
          class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent mt-6 flex min-h-14 items-center justify-between rounded-xl bg-ink px-5 py-4 text-sm font-medium text-white hover:bg-accent disabled:hover:bg-ink"
          disabled={!canSubmit}
        >
          {checked
            ? index === total - 1
              ? free ? "Voltar à primeira questão" : "Ver resultado"
              : "Próxima questão"
            : "Conferir resposta"}
        </button>
      </form>
      <p class="mt-4 text-xs leading-5 text-muted">{hint}</p>
    </>
  );
}
