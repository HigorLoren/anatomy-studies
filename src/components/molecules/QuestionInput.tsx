import { hasAnswerBlanks } from "../../answerBlanks";
import { InlineAnswerBlanks } from "./InlineAnswerBlanks";
import type { Question } from "../../questions";

type QuestionInputProps = {
  answer: string;
  checked: boolean;
  question: Question;
  questionIndex: number;
  viewerReady: boolean;
  onAnswer: (answer: string) => void;
};

export function QuestionInput({
  answer,
  checked,
  question,
  questionIndex,
  viewerReady,
  onAnswer,
}: QuestionInputProps) {
  if (hasAnswerBlanks(question)) {
    return <InlineAnswerBlanks key={question.id} {...{ question, answer, checked, onAnswer }} />;
  }
  const complete = question.kind === "complete";
  return (
    <>
      <label class="mb-2 block text-sm leading-6 font-medium" for="answer">
        {complete
          ? "Termos que completam a frase"
          : question.kind === "compare" ? "Sua resposta" : "Nome da estrutura"}
      </label>
      <input
        class="font-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-ink"
        id="answer"
        key={questionIndex}
        value={answer}
        onInput={(event) => onAnswer(event.currentTarget.value)}
        placeholder={
          complete ? "Complete com o termo anatômico" : "Digite o nome anatômico completo"
        }
        disabled={checked || (Boolean(question.model || question.highlight) && !viewerReady)}
        autoComplete="off"
      />
    </>
  );
}
