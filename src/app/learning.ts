import { filterQuestions, type Question, type TestConfig } from "../questions";

export const STORAGE_KEY = "anatomia.progress.v1";
export type QuestionRecord = { attempts: number; errors: number; lastCorrect: boolean };
export type Session = {
  ids: string[]; index: number; answers: (string | null)[]; draft: string;
};
export type Learning = {
  version: 1; records: Record<string, QuestionRecord>; session: Session | null;
  config: TestConfig;
};
export const emptyLearning = (): Learning => ({
  version: 1, records: {}, session: null, config: { count: 20 },
});
export const formatQuestions = (count: number) => `${count} ${count === 1 ? "questão" : "questões"}`;
export const points = (count: number) => count > 0 ? 10 / count : 0;
export const formatPoints = (value: number) => value.toLocaleString("pt-BR", {
  maximumFractionDigits: 2,
});

export function recordAnswer(records: Learning["records"], id: string, correct: boolean) {
  const previous = records[id] ?? { attempts: 0, errors: 0, lastCorrect: false };
  return { ...records, [id]: {
    attempts: previous.attempts + 1, errors: previous.errors + Number(!correct),
    lastCorrect: correct,
  } };
}

export function testPool(config: Omit<TestConfig, "count">, records: Learning["records"]) {
  const pool = filterQuestions(config);
  if (!config.review) return pool;
  return pool.filter(question => records[question.id]?.lastCorrect === false)
    .sort((a, b) => records[b.id].errors - records[a.id].errors);
}

export function restoreLearning(raw: string | null, bank: Question[]): Learning {
  const fallback = emptyLearning();
  try {
    const data = JSON.parse(raw ?? "null");
    if (data?.version !== 1) return fallback;
    const ids = new Set(bank.map(question => question.id));
    const records = Object.fromEntries(Object.entries(data.records ?? {})
      .filter(([id, record]) => ids.has(id) && validRecord(record)));
    return { ...fallback, records: records as Learning["records"],
      config: validConfig(data.config, bank), session: validSession(data.session, ids) };
  } catch { return fallback; }
}

function validRecord(record: unknown): record is QuestionRecord {
  if (!record || typeof record !== "object") return false;
  const value = record as QuestionRecord;
  return Number.isSafeInteger(value.attempts) && value.attempts > 0
    && Number.isSafeInteger(value.errors) && value.errors >= 0 && value.errors <= value.attempts
    && typeof value.lastCorrect === "boolean";
}

function validConfig(config: TestConfig | undefined, bank: Question[]): TestConfig {
  if (!config || typeof config !== "object") return { count: 20 };
  return {
    count: Number.isSafeInteger(config.count) ? Math.max(1, config.count) : 20,
    categories: Array.isArray(config.categories)
      ? config.categories.filter(category => bank.some(question => question.category === category))
      : undefined,
    kinds: Array.isArray(config.kinds)
      ? config.kinds.filter(kind => bank.some(question => question.kind === kind)) : undefined,
    review: config.review === true,
  };
}

function validSession(session: Session | null, ids: Set<string>): Session | null {
  if (!session || !Array.isArray(session.ids) || !session.ids.length
    || session.ids.length > ids.size || !session.ids.every(id => ids.has(id))
    || new Set(session.ids).size !== session.ids.length) return null;
  return validSessionAnswers(session);
}

function validSessionAnswers(session: Session): Session | null {
  if (!Number.isInteger(session.index) || session.index < 0 || session.index >= session.ids.length
    || !Array.isArray(session.answers) || session.answers.length > session.ids.length
    || !session.answers.every(value => value === null || typeof value === "string")
    || typeof session.draft !== "string") return null;
  return session;
}
