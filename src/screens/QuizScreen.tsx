import { hasAnswerBlanks } from "../answerBlanks";
import { ProgressBar } from "../components/molecules/ProgressBar";
import { AtlasViewer } from "../components/organisms/AtlasViewer";
import { QuizForm } from "../components/organisms/QuizForm";
import { DEFAULT_MODEL } from "../models";
import { MARKER_BONES, type Question } from "../questions";
import type { Exercise, ViewerStatus } from "../viewer";

type QuizScreenProps = {
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
  onStatus: (status: ViewerStatus) => void;
};

const questionKinds = {
  complete: "Completar a frase",
  identify: "Identificação",
  name: "Denominação",
  compare: "Diferenciação",
};

function getExercise(
  question: Question,
  answer: string,
  checked: boolean,
  correct: boolean,
): Exercise {
  if (question.kind === "name") return {
    clayTarget: question.highlight,
    isolatedBones: question.isolatedBones,
  };

  if (question.kind !== "identify") return null;

  const markers = question.markers ?? MARKER_BONES;
  return {
    markers,
    isolatedBones: question.isolatedBones,
    highlight: answer ? markers[Number(answer) - 1] : undefined,
    highlightColor: checked ? (correct ? "green" : "red") : "blue",
    correctHighlight:
      checked && !correct
        ? markers[Number(question.answer) - 1]
        : undefined,
  };
}

export function QuizScreen(props: QuizScreenProps) {
  const {
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
    onStatus,
  } = props;

  const exercise = getExercise(question, answer, checked, correct);

  return (
    <section class="flex min-w-0 items-center">
      <div class="min-w-0 w-full">
        <div class="flex justify-between gap-4 text-xs text-muted">
          <span class="shrink-0" aria-label={`Questão ${index + 1} de ${total}`}>
            <span class="sm:hidden">{index + 1} / {total}</span>
            <span class="hidden sm:inline">Questão {index + 1} de {total}</span>
          </span>
          <span>{questionKinds[question.kind]}</span>
        </div>
        <ProgressBar current={index} total={total} />
        {question.kind === "name" && exercise?.clayTarget && (
          <p class="mb-3 flex items-center gap-2 text-xs text-muted">
            <span class="h-3 w-3 shrink-0 rounded-sm border-2 border-blue-500" aria-hidden="true" />
            A massinha azul indica a estrutura a nomear.
          </p>
        )}
        {!hasAnswerBlanks(question) && <>
        <h1 class="mb-2 text-[clamp(2rem,3vw,2.6rem)] leading-[1.13] font-medium tracking-[-0.045em]">
          {question.title}
        </h1>
        <p class="text-[14px] text-muted">{question.instruction}</p>
        </>}
        {(question.model || question.kind === "identify" ||
          (question.kind === "name" && question.highlight)) && (
          <AtlasViewer
            mode="quiz"
            model={question.model ?? DEFAULT_MODEL}
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
          }}
        />
      </div>
    </section>
  );
}
