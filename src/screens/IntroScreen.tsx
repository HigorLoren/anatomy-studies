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
  const field = "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-ink";

  return (
    <>
      <div class="flex items-center justify-center overflow-hidden rounded-3xl bg-[#0a0d14] p-8">
        <img class="w-full max-w-110" src={`${import.meta.env.BASE_URL}skull-practice.png`}
          alt="Crânio humano visto de frente e de lado" />
      </div>
      <section>
        <span class="mb-5 block text-sm font-medium text-accent">Prática de anatomia</span>
        <h1 class="mb-5 text-4xl font-medium tracking-tight">Monte seu teste</h1>
        <p class="mb-6 text-muted">
          Escolha a região e a forma de responder. Cada teste tem até 20 questões,
          sorteadas de um banco com {QUESTION_BANK.length} perguntas.
        </p>
        <form class="space-y-5" onSubmit={(event) => {
          event.preventDefault();
          if (total) onStart({ category, kind, count: total });
        }}>
          <label class="block text-sm font-medium">Região anatômica
            <select class={field} value={category} onChange={(event) =>
              setCategory(event.currentTarget.value as TestConfig["category"])}>
              <option value="all">Todas as regiões</option>
              {Object.entries(CATEGORIES).map(([value, label]) =>
                <option value={value}>{label}</option>)}
            </select>
          </label>
          <label class="block text-sm font-medium">Tipo de questão
            <select class={field} value={kind} onChange={(event) =>
              setKind(event.currentTarget.value as TestConfig["kind"])}>
              <option value="all">Teste misto</option>
              {Object.entries(QUESTION_KINDS).map(([value, label]) =>
                <option value={value}>{label}</option>)}
            </select>
          </label>
          <label class="block text-sm font-medium">Máximo de questões
            <select class={field} value={count}
              onChange={(event) => setCount(Number(event.currentTarget.value))}>
              {[5, 10, 15, 20].map((value) => <option value={value}>{value}</option>)}
            </select>
          </label>
          <p class="text-sm text-muted" role="status">
            {available ? `${available} disponíveis · este teste terá ${total} questões.`
              : "Não há perguntas para essa combinação. Escolha outra região ou tipo."}
          </p>
          <button disabled={!total} class="rounded-xl bg-ink px-5 py-4 text-white disabled:opacity-45">
            Começar teste
          </button>
        </form>
        <button onClick={onBank} class="mt-5 rounded-xl border border-slate-300 px-5 py-4 text-accent">
          Prática livre: escolher qualquer questão
        </button>
      </section>
    </>
  );
}
