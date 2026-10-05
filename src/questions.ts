import type { ModelId } from "./models";

export const MARKER_BONES = [
  "Frontal bone",
  "Nasal bone",
  "Zygomatic bone",
  "Maxilla bone",
  "Mandible bone",
];

export const CATEGORIES = {
  skull: "Crânio",
  thorax: "Tórax",
  spine: "Coluna vertebral",
} as const;
export type Category = keyof typeof CATEGORIES;

export const QUESTION_KINDS = {
  identify: "Identificação",
  name: "Denominação",
  complete: "Completar a frase",
} as const;

export type Question = {
  id: string;
  category: Category;
  kind: "identify" | "name" | "complete";
  title: string;
  instruction: string;
  answer: string;
  accepted: string[];
  explanation: string;
  highlight?: string;
  model?: ModelId;
  markers?: string[];
  markerNames?: string[];
};

const rawQuestions: Omit<Question, "id" | "category">[] = [
  {
    kind: "identify",
    title: "Qual número indica o osso frontal?",
    instruction:
      "Observe os cinco pontos no crânio e selecione o número correspondente.",
    answer: "1",
    accepted: ["1"],
    explanation:
      "O ponto 1 corresponde ao osso frontal, uma das estruturas do neurocrânio.",
  },
  {
    kind: "identify",
    title: "Qual número indica o osso zigomático?",
    instruction:
      "Gire o modelo se precisar. Os números acompanham as estruturas.",
    answer: "3",
    accepted: ["3"],
    explanation:
      "O ponto 3 corresponde ao osso zigomático, listado entre os ossos do viscerocrânio.",
  },
  {
    kind: "name",
    title: "Como se chama o osso destacado?",
    instruction: "Observe a estrutura em azul e escreva seu nome anatômico.",
    answer: "Mandíbula",
    accepted: ["mandíbula", "osso mandíbula", "osso mandibular"],
    highlight: "Mandible bone",
    explanation:
      "A estrutura destacada é a mandíbula, um dos ossos do viscerocrânio.",
  },
  {
    kind: "name",
    title: "Denomine esta estrutura.",
    instruction: "Identifique o osso destacado em azul no modelo.",
    answer: "Osso nasal",
    accepted: ["nasal", "osso nasal", "ossos nasais"],
    highlight: "Nasal bone",
    explanation: "O destaque mostra o osso nasal, parte do viscerocrânio.",
  },
  {
    kind: "complete",
    title: "Complete a frase",
    instruction: "Preencha a lacuna com o nome da divisão do crânio.",
    answer: "Neurocrânio",
    accepted: ["neurocrânio"],
    explanation:
      "No catálogo, os ossos frontal, parietal, temporal e occipital estão agrupados no neurocrânio.",
  },
];

const spineStructures = [
  { key: "Atlas", name: "Atlas", accepted: ["atlas", "C1", "primeira vértebra cervical"], explanation: "O atlas é a primeira vértebra cervical (C1) e se articula com o crânio." },
  { key: "Axis", name: "Áxis", accepted: ["áxis", "C2", "segunda vértebra cervical"], explanation: "O áxis é a segunda vértebra cervical (C2), caracterizada pela presença do dente." },
  { key: "Vertebra_C7", name: "Vértebra proeminente (C7)", accepted: ["C7", "vértebra proeminente", "sétima vértebra cervical", "vértebra cervical C7"], explanation: "C7 é conhecida como vértebra proeminente por seu processo espinhoso longo." },
  { key: "Vertebra_C4", name: "Vértebra cervical típica", accepted: ["vértebra cervical típica", "vértebra cervical", "cervical", "C4"], explanation: "O destaque corresponde a C4, um exemplo de vértebra cervical típica, com forames transversários." },
  { key: "Vertebra_T7", name: "Vértebra torácica", accepted: ["vértebra torácica", "torácica", "T7"], explanation: "O destaque corresponde a T7, uma vértebra torácica que apresenta superfícies articulares para as costelas." },
  { key: "Vertebra_L3", name: "Vértebra lombar", accepted: ["vértebra lombar", "lombar", "L3"], explanation: "O destaque corresponde a L3, uma vértebra lombar com corpo volumoso adaptado à sustentação de peso." },
  { key: "sacrum", name: "Sacro", accepted: ["sacro", "osso sacro"], explanation: "O sacro resulta habitualmente da fusão de cinco vértebras sacrais." },
  { key: "Coccyx", name: "Cóccix", accepted: ["cóccix", "osso cóccix"], explanation: "O cóccix é a porção terminal da coluna vertebral, abaixo do sacro." },
];

for (const [index, structure] of spineStructures.entries()) {
  const model: ModelId = index < 4 ? "spine-cervical-practice" : "spine-practice";
  // Pequenos grupos mantêm os marcadores legíveis ao girar a coluna.
  const group = spineStructures.slice(
    structure.key === "Atlas" || structure.key === "Axis" || structure.key === "Vertebra_C7" || structure.key === "Vertebra_C4" ? 0 : 4,
    structure.key === "Atlas" || structure.key === "Axis" || structure.key === "Vertebra_C7" || structure.key === "Vertebra_C4" ? 4 : 8,
  );
  const number = String(group.indexOf(structure) + 1);
  rawQuestions.push(
    {
      kind: "identify",
      model,
      title: `Qual número indica a estrutura: ${structure.name}?`,
      instruction: "Gire e aproxime a coluna para localizar a estrutura. Selecione seu número.",
      markers: group.map((item) => item.key),
      markerNames: group.map((item) => item.name),
      answer: number,
      accepted: [number],
      explanation: `O ponto ${number} indica ${structure.name}. ${structure.explanation}`,
    },
    {
      kind: "name",
      model,
      title: "Como se chama a estrutura destacada na coluna?",
      instruction: "Observe o destaque azul, gire o modelo e escreva o nome anatômico.",
      highlight: structure.key,
      answer: structure.name,
      accepted: structure.accepted,
      explanation: structure.explanation,
    },
  );
}

rawQuestions.push({
  kind: "identify",
  model: "thorax-practice",
  title: "Qual número indica o corpo do esterno?",
  instruction: "Gire o tórax e selecione o ponto correspondente à parte alongada do esterno.",
  markers: ["Body of sternum", "Vertebra_T7", "Vertebra_L3", "sacrum"],
  markerNames: ["o corpo do esterno", "a vértebra torácica T7", "a vértebra lombar L3", "o sacro"],
  answer: "1",
  accepted: ["1"],
  explanation: "O ponto 1 indica o corpo do esterno, sua porção intermediária e mais longa.",
}, {
  kind: "name",
  model: "thorax-practice",
  title: "Qual parte do esterno está destacada?",
  instruction: "Observe a parte alongada em azul e escreva seu nome anatômico.",
  highlight: "Body of sternum",
  answer: "Corpo do esterno",
  accepted: ["corpo do esterno", "corpo esternal"],
  explanation: "O corpo do esterno é sua porção intermediária, entre o manúbrio e o processo xifoide.",
});

export const QUESTION_BANK: Question[] = rawQuestions.map((question, index) => ({
  ...question,
  id: `question-${index + 1}`,
  category: question.model?.startsWith("spine-") ? "spine"
    : question.model === "thorax-practice" ? "thorax" : "skull",
}));

export type TestConfig = {
  category: Category | "all";
  kind: Question["kind"] | "all";
  count: number;
};

export function filterQuestions(config: Pick<TestConfig, "category" | "kind">) {
  return QUESTION_BANK.filter((question) =>
    (config.category === "all" || question.category === config.category) &&
    (config.kind === "all" || question.kind === config.kind),
  );
}

export function createTest(config: TestConfig): Question[] {
  const pool = [...filterQuestions(config)];
  for (let index = pool.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[other]] = [pool[other], pool[index]];
  }
  const count = Number.isFinite(config.count) ? Math.trunc(config.count) : 20;
  return pool.slice(0, Math.max(1, Math.min(20, count)));
}

export const normalizeAnswer = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!]$/, "");

export const isCorrect = (question: Question, answer: string) =>
  question.accepted.some(
    (value) => normalizeAnswer(value) === normalizeAnswer(answer),
  );

const MARKER_NAMES = [
  "o osso frontal",
  "o osso nasal",
  "o osso zigomático",
  "o osso maxilar",
  "a mandíbula",
];

export function explainAnswer(question: Question, answer: string) {
  const selectedBone =
    question.kind === "identify" ? (question.markerNames ?? MARKER_NAMES)[Number(answer) - 1] : undefined;
  const selection =
    selectedBone && !isCorrect(question, answer)
      ? `Você selecionou ${selectedBone} (ponto ${answer}). `
      : "";
  return selection + question.explanation;
}
