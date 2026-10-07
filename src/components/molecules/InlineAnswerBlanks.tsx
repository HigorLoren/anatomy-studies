import type { Question } from "../../questions";

type Props = {
  question: Question;
  answer: string;
  checked: boolean;
  onAnswer: (value: string) => void;
};

export function InlineAnswerBlanks({ question, answer, checked, onAnswer }: Props) {
  const segments = question.title.split("____");
  const values = answer.split(";");
  const count = segments.length - 1;

  function update(index: number, value: string) {
    const next = Array.from({ length: count }, (_, position) => values[position] ?? "");
    next[index] = value;
    onAnswer(next.join(";"));
  }

  return (
    <>
      <h1 class="text-[clamp(1.35rem,2.5vw,1.8rem)] font-medium leading-[2.2] tracking-tight">
        {segments.map((segment, index) => <span key={index}>
          {segment}
          {index < count && <span
            class="mx-1 my-1 inline-grid max-w-[calc(100%-0.5rem)] align-middle text-base font-normal tracking-normal">
            <span aria-hidden="true"
              class="invisible col-start-1 row-start-1 min-w-[16ch] overflow-hidden whitespace-pre px-3">
              {(values[index] || "Sua resposta") + "  "}
            </span>
            <input
            aria-label={`Lacuna ${index + 1} de ${count}`}
            class="col-start-1 row-start-1 min-h-11 min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-normal tracking-normal text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:bg-slate-50"
            value={values[index] ?? ""}
            onInput={(event) => update(index, event.currentTarget.value)}
            disabled={checked}
            placeholder="Sua resposta"
            autoComplete="off"
            />
          </span>}
        </span>)}
      </h1>
      <p class="mt-3 mb-5 text-sm text-muted">{question.instruction}</p>
    </>
  );
}
