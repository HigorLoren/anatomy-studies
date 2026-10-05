import { classifyAnswer, explainAnswer, type Question } from "../../questions";

type AnswerFeedbackProps = {
  answer: string;
  checked: boolean;
  question: Question;
};

export function AnswerFeedback({
  answer,
  checked,
  question,
}: AnswerFeedbackProps) {
  if (!checked) return null;

  const result = classifyAnswer(question, answer);
  const correct = result === "correct";
  const incomplete = result === "incomplete";
  const color = correct ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : incomplete ? "border-yellow-300 bg-yellow-50 text-yellow-900"
    : "border-red-300 bg-red-50 text-red-900";

  return (
    <div
      class={`mt-6 rounded-xl border px-5 py-4 text-sm leading-6 ${color}`}
      role="status"
    >
      <strong class="flex items-center gap-2">
        <span
          class="flex size-6 items-center justify-center rounded-full bg-current/10 text-xl leading-none"
          aria-hidden="true"
        >
          {correct ? "✓" : incomplete ? "!" : "×"}
        </span>
        {correct ? "Resposta correta!" : incomplete ? "Quase certo: nome incompleto" : "Resposta incorreta"}
      </strong>
      {incomplete && (
        <p class="mt-2 mb-0">
          Você identificou a estrutura, mas precisa escrever o nome completo.
          Esta resposta não conta como acerto.
        </p>
      )}
      {!correct && (
        <p class="mt-2 mb-0">
          Resposta correta: <b>{question.answer}</b>
        </p>
      )}
      <p class="mt-2 mb-0">{explainAnswer(question, answer)}</p>
    </div>
  );
}
