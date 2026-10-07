import { useState } from "preact/hooks";
import {
  CATEGORIES, QUESTION_BANK, QUESTION_KINDS, filterQuestions,
  type TestConfig,
} from "../questions";

type Props = { onStart: (config: TestConfig) => void; onBank: () => void };

export function IntroScreen({ onStart, onBank }: Props) {
  const [category, setCategory] = useState<TestConfig["category"]>("all");
  const [kind, setKind] = useState<TestConfig["kind"]>("all");
  const [count, setCount] = useState(20);
  const available = filterQuestions({ category, kind }).length;
  const total = Math.min(count, available, 20);
  const field = "mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white p-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const buttonFocus = "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

  return (
    <>
      <section aria-labelledby="test-title" class="min-w-0">
        <div class="mb-7 max-w-2xl">
          <h1 id="test-title" class="mb-3 text-3xl font-medium tracking-tight text-ink md:text-4xl">Monte seu teste</h1>
          <p class="leading-7 text-muted">
            Escolha a região, o tipo de questão e quantas perguntas quer responder.
            Cada teste tem até 20 questões sorteadas da base.
          </p>
        </div>
        <form class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8" onSubmit={(event) => {
          event.preventDefault();
          if (total) onStart({ category, kind, count: total });
        }}>
          <div class="grid gap-5 lg:grid-cols-[1fr_1fr_0.7fr]">
          <label class="block min-w-0 text-sm font-medium text-ink">Região anatômica
            <select class={field} value={category} onChange={(event) =>
              setCategory(event.currentTarget.value as TestConfig["category"])}>
              <option value="all">Todas as regiões</option>
              {Object.entries(CATEGORIES).map(([value, label]) =>
                <option value={value}>{label}</option>)}
            </select>
          </label>
          <label class="block min-w-0 text-sm font-medium text-ink">Tipo de questão
            <select class={field} value={kind} onChange={(event) =>
              setKind(event.currentTarget.value as TestConfig["kind"])}>
              <option value="all">Teste misto</option>
              {Object.entries(QUESTION_KINDS).map(([value, label]) =>
                <option value={value}>{label}</option>)}
            </select>
          </label>
          <label class="block min-w-0 text-sm font-medium text-ink">Máximo de questões
            <select class={field} value={count}
              onChange={(event) => setCount(Number(event.currentTarget.value))}>
              {[5, 10, 15, 20].map((value) => <option value={value}>{value}</option>)}
            </select>
          </label>
          </div>
          <div class="mt-7 flex flex-col gap-5 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm leading-6 text-muted" role="status" aria-live="polite">
            {available ? <><span class="font-medium text-ink">{total} questões neste teste.</span><br />{available} disponíveis com os filtros selecionados.</>
              : "Não há perguntas para essa combinação. Escolha outra região ou tipo."}
          </p>
          <button type="submit" disabled={!total} class={`${buttonFocus} shrink-0 rounded-xl bg-ink px-7 py-4 font-medium text-white transition-colors hover:bg-accent disabled:cursor-default disabled:opacity-45`}>
            Começar teste
          </button>
          </div>
        </form>
      </section>
      <section aria-labelledby="bank-title" class="flex min-w-0 flex-col gap-5 rounded-2xl bg-slate-100 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h2 id="bank-title" class="mb-1 text-lg font-medium text-ink">Base de perguntas</h2>
          <p class="max-w-xl text-sm leading-6 text-muted">Explore as {QUESTION_BANK.length} perguntas e escolha uma questão para praticar livremente.</p>
        </div>
        <button type="button" onClick={onBank} class={`${buttonFocus} shrink-0 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-accent transition-colors hover:border-accent hover:bg-slate-50`}>
          Acessar base de perguntas
        </button>
      </section>
    </>
  );
}
