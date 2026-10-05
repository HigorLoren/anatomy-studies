import { classifyAnswer, explainAnswer, type Question } from "../../questions";

type Props = { answers: string[]; questions: Question[] };

export function ResultAnswers({ answers, questions }: Props) {
  return (
    <div class="mt-6 border-t border-slate-200">
      {questions.map((question, index) => {
        const result = classifyAnswer(question, answers[index]);
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
            </summary>
            {incomplete && <p class="ml-8 mt-3 text-sm text-yellow-800">
              Quase certo: nome incompleto. Use o nome completo indicado abaixo.
            </p>}
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
