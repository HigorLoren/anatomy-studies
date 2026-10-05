import { QUESTION_BANK } from "../../questions";

type Props = { index: number; onSelect: (index: number) => void };

export function QuestionNavigator({ index, onSelect }: Props) {
  return (
                <label class="flex min-w-0 max-w-full items-center gap-2 text-sm">
                  Ir para questão
                  <select
                    class="min-w-0 rounded-lg border border-slate-300 p-2 sm:hidden"
                    value={index}
                    onChange={(event) =>
                      onSelect(Number(event.currentTarget.value))
                    }
                  >
                    {QUESTION_BANK.map((_, index) => (
                      <option value={index}>{index + 1} / {QUESTION_BANK.length}</option>
                    ))}
                  </select>
                  <select
                    class="hidden min-w-0 max-w-full rounded-lg border border-slate-300 p-2 sm:block"
                    value={index}
                    onChange={(event) =>
                      onSelect(Number(event.currentTarget.value))
                    }
                  >
                    {QUESTION_BANK.map((question, index) => (
                      <option value={index}>
                        {index + 1} · {question.title}
                      </option>
                    ))}
                  </select>
                </label>
  );
}
