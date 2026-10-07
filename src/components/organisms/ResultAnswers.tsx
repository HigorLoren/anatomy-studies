import { answerIssue } from "../../answerIssue";
import { classifyAnswer, explainAnswer, type Question } from "../../questions";
import { formatPoints, points } from "../../app/learning";

type Props = { answers: (string | null)[]; questions: Question[] };

export function ResultAnswers({ answers, questions }: Props) {
  return (
    <div class="mt-6 border-t border-slate-200">
      {questions.map((question, index) => {
        const value = answers[index] ?? "";
        const reason = answerIssue(question, value);
        const explanation = explainAnswer(question, value);
        const result = classifyAnswer(question, value);
        const correct = result === "correct";
        const incomplete = result === "incomplete";
        return (
          <details class="border-b border-slate-200 py-3 text-[16px]">
            <summary class="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent flex cursor-pointer items-center gap-3">
              <span
                class={
                  correct ? "text-lg text-emerald-700"
                    : incomplete ? "text-xl text-yellow-700" : "text-xl text-red-700"
                }
              >
                {correct ? "✓" : incomplete ? "!" : "×"}
              </span>
              <span>{question.title}</span>
              <span class="ml-auto shrink-0 text-sm text-muted">
                {formatPoints(correct ? points(questions.length) : 0)}
                {" / "}{formatPoints(points(questions.length))}
              </span>
            </summary>
            {incomplete && <p class="ml-8 mt-3 text-sm text-yellow-800">
              Quase certo: nome incompleto. Esta resposta não conta como acerto.
            </p>}
            {reason && <p class="ml-8 mt-3 text-sm leading-6 text-mist-700">{reason}</p>}
            <p class="ml-8 mt-3 text-sm leading-6 text-mist-700">
              <b>Sua resposta:</b> {answers[index] || "Não sei"}
              <br />
              <b>Resposta correta:</b> {question.answer}
            </p>
            {explanation && <p class="ml-8 mt-3 text-sm leading-6 text-mist-700">
              {explanation}
            </p>}
          </details>
        );
      })}
    </div>
  );
}
