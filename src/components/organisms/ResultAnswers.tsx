import { explainAnswer, isCorrect, QUESTIONS } from "../../questions";

export function ResultAnswers({ answers }: { answers: string[] }) {
  return (
    <div class="mt-6 border-t border-slate-200">
      {QUESTIONS.map((question, index) => {
        const correct = isCorrect(question, answers[index]);
        return (
          <details class="border-b border-slate-200 py-3 text-[16px]">
            <summary class="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent flex cursor-pointer items-center gap-3">
              <span
                class={
                  correct ? "text-lg text-emerald-700" : "text-xl text-red-700"
                }
              >
                {correct ? "✓" : "×"}
              </span>
              <span>{question.title}</span>
            </summary>
            <p class="ml-8 mt-3 text-sm leading-6 text-mist-700">
              <b>Sua resposta:</b> {answers[index]}
              <br />
              <b>Resposta correta:</b> {question.answer}
            </p>
            <p class="ml-8 mt-3 text-sm leading-6 text-mist-700">
              {explainAnswer(question, answers[index])}
            </p>
          </details>
        );
      })}
    </div>
  );
}
