import { ProgressBar } from "../components/molecules/ProgressBar";
import { AtlasViewer } from "../components/organisms/AtlasViewer";
import { QuizForm } from "../components/organisms/QuizForm";
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

export function QuizScreen(props: QuizScreenProps) {
  const {
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
  } = props;

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
