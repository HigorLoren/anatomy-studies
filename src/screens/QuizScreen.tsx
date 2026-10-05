import {
  AnswerFeedback,
  SelectionFeedback,
} from "../components/molecules/AnswerFeedback";
import { MarkerPicker } from "../components/molecules/MarkerPicker";
import { ProgressBar } from "../components/molecules/ProgressBar";
import { QuestionInput } from "../components/molecules/QuestionInput";
import { AtlasViewer } from "../components/organisms/AtlasViewer";
import { DEFAULT_MODEL } from "../models";
import { MARKER_BONES, QUESTIONS, type Question } from "../questions";
import type { Exercise, ViewerStatus } from "../viewer";

type QuizScreenProps = {
  answer: string;
  checked: boolean;
  correct: boolean;
  index: number;
  question: Question;
  status: ViewerStatus;
  onAdvance: () => void;
  onAnswer: (answer: string) => void;
  onCheck: () => void;
  onStatus: (status: ViewerStatus) => void;
};

const questionKinds = {
  complete: "Completar a frase",
  identify: "Identificação",
  name: "Denominação",
};

function QuizForm({
  answer,
  checked,
  correct,
  index,
  question,
  status,
  onAdvance,
  onAnswer,
  onCheck,
}: Omit<QuizScreenProps, "onStatus">) {
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
            ? index === QUESTIONS.length - 1
              ? "Ver resultado"
              : "Próxima questão"
            : "Conferir resposta"}
        </button>
      </form>
      <p class="mt-4 text-xs leading-5 text-muted">{hint}</p>
    </>
  );
}

function getExercise(
  question: Question,
  answer: string,
  checked: boolean,
  correct: boolean,
): Exercise {
  if (question.kind === "name") return { highlight: question.highlight };
  if (question.kind === "complete") return null;
  return {
    markers: MARKER_BONES,
    highlight: answer ? MARKER_BONES[Number(answer) - 1] : undefined,
    highlightColor: checked ? (correct ? "green" : "red") : "blue",
    correctHighlight:
      checked && !correct
        ? MARKER_BONES[Number(question.answer) - 1]
        : undefined,
  };
}

export function QuizScreen({
  answer,
  checked,
  correct,
  index,
  question,
  status,
  onAdvance,
  onAnswer,
  onCheck,
  onStatus,
}: QuizScreenProps) {
  const exercise = getExercise(question, answer, checked, correct);
  return (
    <section class="flex items-center">
      <div class="w-full">
        <div class="flex justify-between gap-4 text-xs text-muted">
          <span>
            Questão {index + 1} de {QUESTIONS.length}
          </span>
          <span>{questionKinds[question.kind]}</span>
        </div>
        <ProgressBar current={index} total={QUESTIONS.length} />
        <h1 class="mb-2 text-[clamp(2rem,3vw,2.6rem)] leading-[1.13] font-medium tracking-[-0.045em]">
          {question.title}
        </h1>
        <p class="text-[14px] text-muted">{question.instruction}</p>
        {question.kind !== "complete" && (
          <AtlasViewer
            mode="quiz"
            model={DEFAULT_MODEL}
            exercise={exercise}
            answer={answer}
            checked={checked}
            questionIndex={index}
            onNumberSelect={onAnswer}
            onStatus={onStatus}
          />
        )}
        <QuizForm
          {...{
            answer,
            checked,
            correct,
            index,
            question,
            status,
            onAdvance,
            onAnswer,
            onCheck,
          }}
        />
      </div>
    </section>
  );
}
