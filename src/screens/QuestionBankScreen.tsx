import { useState } from "preact/hooks";
import {
  CATEGORIES, QUESTION_KINDS, filterQuestions, type TestConfig,
} from "../questions";

type Props = { onSelect: (id: string) => void; onTest: () => void };

export function QuestionBankScreen({ onSelect, onTest }: Props) {
  const [category, setCategory] = useState<TestConfig["category"]>("all");
  const [kind, setKind] = useState<TestConfig["kind"]>("all");
  const questions = filterQuestions({ category, kind });
  return (
    <section>
      <h1 class="text-3xl font-medium tracking-tight">Banco de questões</h1>
      <p class="mt-3 text-muted">Escolha qualquer pergunta para praticar livremente.</p>
      <div class="my-6 flex flex-wrap gap-4">
        <label>Região
          <select class="ml-2 rounded-lg border border-slate-300 p-2" value={category}
            onChange={(event) => setCategory(event.currentTarget.value as TestConfig["category"])}>
            <option value="all">Todas</option>
            {Object.entries(CATEGORIES).map(([value, label]) =>
              <option value={value}>{label}</option>)}
          </select>
        </label>
        <label>Tipo
          <select class="ml-2 rounded-lg border border-slate-300 p-2" value={kind}
            onChange={(event) => setKind(event.currentTarget.value as TestConfig["kind"])}>
            <option value="all">Todos</option>
            {Object.entries(QUESTION_KINDS).map(([value, label]) =>
              <option value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      {!questions.length && <p role="status">Não há perguntas para esses filtros.</p>}
      {Object.entries(CATEGORIES).map(([value, label]) => {
        const group = questions.filter((question) => question.category === value);
        return group.length > 0 && (
          <section class="mb-8" key={value}>
            <h2 class="mb-3 text-xl font-medium">{label} · {group.length}</h2>
            <ul class="space-y-2">
              {group.map((question) => (
                <li key={question.id}>
                  <button class="w-full rounded-xl border border-slate-200 p-4 text-left hover:border-accent"
                    onClick={() => onSelect(question.id)}>
                    <span class="block text-xs text-muted">
                      {question.sourceNumber ? `Questão ${question.sourceNumber} do simulado`
                        : question.id.startsWith("p1-") ? `Roteiro da P1 · ${question.p1Items?.length === 1 ? "Item" : "Itens"} ${question.p1Items?.join(", ")}`
                          : `Questão ${question.id.replace("question-", "")}`} · {QUESTION_KINDS[question.kind]}
                    </span>
                    <span class="mt-1 block">{question.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <button class="rounded-xl bg-ink px-5 py-3 text-white" onClick={onTest}>Montar teste</button>
    </section>
  );
}
