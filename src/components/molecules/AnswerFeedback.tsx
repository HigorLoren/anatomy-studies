import { explainAnswer, type Question } from "../../questions";

type AnswerFeedbackProps = {
  answer: string;
  checked: boolean;
  correct: boolean;
  question: Question;
};

export function AnswerFeedback({
  answer,
  checked,
  correct,
  question,
}: AnswerFeedbackProps) {
  if (!checked) return null;

  return (
    <div
      class={`mt-6 rounded-xl border px-5 py-4 text-sm leading-6 ${correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-900"}`}
      role="status"
    >
      <strong class="flex items-center gap-2">
        <span
          class="flex size-6 items-center justify-center rounded-full bg-current/10 text-xl leading-none"
          aria-hidden="true"
        >
          {correct ? "✓" : "×"}
        </span>
        {correct ? "Resposta correta!" : "Resposta incorreta"}
      </strong>
      {!correct && (
        <p class="mt-2 mb-0">
          Resposta correta: <b>{question.answer}</b>
        </p>
      )}
      <p class="mt-2 mb-0">{explainAnswer(question, answer)}</p>
    </div>
  );
}
