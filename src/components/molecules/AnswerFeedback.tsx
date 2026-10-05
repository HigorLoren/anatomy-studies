import { explainAnswer, type Question } from "../../questions";

type AnswerFeedbackProps = {
  answer: string;
  checked: boolean;
  correct: boolean;
  question: Question;
};

export function SelectionFeedback({
  answer,
  checked,
  correct,
}: Omit<AnswerFeedbackProps, "question">) {
  if (!answer) return null;
  const color = checked
    ? correct
      ? "bg-emerald-500"
      : "bg-red-500"
    : "bg-blue-500";
  const label = checked
    ? correct
      ? "Sua resposta está correta"
      : "Sua escolha"
    : "Osso selecionado no modelo";
  return (
    <div
      class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"
      aria-live="polite"
    >
      <span class="flex items-center gap-2">
        <i class={`size-2.5 rounded-full ${color}`} />
        {label}
      </span>
      {checked && !correct && (
        <span class="flex items-center gap-2">
          <i class="size-2.5 rounded-full bg-emerald-500" />
          Resposta correta
        </span>
      )}
    </div>
  );
}

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
