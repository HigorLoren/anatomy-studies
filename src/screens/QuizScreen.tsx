import { useState } from "preact/hooks";
import { hasAnswerBlanks } from "../answerBlanks";
import { ProgressBar } from "../components/molecules/ProgressBar";
import { PracticalViewer } from "../components/organisms/PracticalViewer";
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

  const [selectionSequence, setSelectionSequence] = useState(0);
  const selectAnswer = (value: string) => {
    if (question.kind === "identify") setSelectionSequence((sequence) => sequence + 1);
    onAnswer(value);
  };
  const exercise = getExercise(question, answer, checked, correct);

  const showViewer = Boolean(question.model || question.kind === "identify" ||
    (question.kind === "name" && question.highlight));
  const form = <QuizForm {...{
    total, free, answer, checked, correct, index, question, status,
    onAdvance, onAnswer: selectAnswer, onCheck, onSkip,
  }} />;

  return (
    <section class={`quiz-screen ${showViewer ? "quiz-screen--visual" : "quiz-screen--written"}`}>
      <div class="min-w-0 w-full">
        <div class="flex justify-between gap-4 text-xs text-muted">
          <span class="shrink-0" aria-label={`Questão ${index + 1} de ${total}`}>
            <span class="sm:hidden">{index + 1} / {total}</span>
            <span class="hidden sm:inline">Questão {index + 1} de {total}</span>
          </span>
          <span>{questionKinds[question.kind]}</span>
        </div>
        <ProgressBar current={index} total={total} />
        {!hasAnswerBlanks(question) && <>
        <h1 class="quiz-title">
          {question.title}
        </h1>
        <p class="quiz-instruction">{question.instruction}</p>
        </>}
        {showViewer ? (
          <PracticalViewer
            key={question.id}
            question={question}
            mode="quiz"
            model={question.model ?? DEFAULT_MODEL}
            exercise={exercise}
            answer={answer}
            checked={checked}
            questionIndex={index}
            onNumberSelect={selectAnswer}
            selectionSequence={selectionSequence}
            onStatus={onStatus}
          >{form}</PracticalViewer>
        ) : form}

      </div>
    </section>
  );
}
