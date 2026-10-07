import { alignProfessorQuestion } from "./professorContent";
import { P1_COMPLEMENT } from "./p1Questions";
import { SIMULADO_PART_1 } from "./simuladoPart1";
import { SIMULADO_PART_2 } from "./simuladoPart2";
import { SIMULADO_PART_3 } from "./simuladoPart3";
import type { ModelId } from "./models";
import { createMuscleQuestions, muscleNamingQuestion } from "./muscles";

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
  upper: "Membro superior",
  lower: "Membro inferior e pelve",
  abdomen: "Abdome",
  nervous: "Sistema nervoso",
} as const;
export type Category = keyof typeof CATEGORIES;

export const QUESTION_KINDS = {
  identify: "Identificação",
  name: "Denominação",
  complete: "Completar a frase",
  compare: "Diferenciação",
} as const;

export type Question = {
  id: string;
  category: Category;
  kind: "identify" | "name" | "complete" | "compare";
  sourceNumber?: number;
  answerGroups?: string[][];
  incompleteAnswerGroups?: string[][];
  unorderedGroups?: boolean;
  p1Items?: number[];
  title: string;
  instruction: string;
  answer: string;
  accepted: string[];
  incompleteAccepted?: string[];
  explanation: string;
  highlight?: string;
  model?: ModelId;
  markers?: string[];
  isolatedBones?: string[];
  markerNames?: string[];
};

const rawQuestions: Omit<Question, "id" | "category">[] = [
  {
    kind: "identify",
    title: "Qual número indica o osso frontal?",
    p1Items: [1],
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
    p1Items: [8],
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
    instruction: "Observe a estrutura com contorno azul e escreva seu nome anatômico.",
    answer: "Osso mandíbula",
    accepted: ["osso mandíbula", "osso mandibular"],
    incompleteAccepted: ["mandíbula", "mandibular"],
    highlight: "Mandible bone",
    explanation:
      "A estrutura destacada é a mandíbula, um dos ossos do viscerocrânio.",
  },
  {
    kind: "name",
    title: "Denomine esta estrutura.",
    instruction: "Identifique o osso com contorno azul no modelo.",
    answer: "Osso nasal",
    accepted: ["osso nasal", "ossos nasais"],
    incompleteAccepted: ["nasal"],
    highlight: "Nasal bone",
    explanation: "O destaque mostra o osso nasal, parte do viscerocrânio.",
  },
  {
    kind: "complete",
    title: "Os ossos frontal, parietal, temporal e occipital pertencem ao ____.",
    p1Items: [1, 2, 3, 4],
    instruction: "Preencha a lacuna com o nome da divisão do crânio.",
    answer: "Neurocrânio",
    accepted: ["neurocrânio"],
    explanation:
      "Os ossos frontal, parietal, temporal e occipital pertencem ao neurocrânio.",
  },
];

const spineStructures = [
  { key: "Atlas", name: "Vértebra cervical atlas", accepted: ["primeira vértebra cervical (atlas)"], incompleteAccepted: ["atlas", "C1", "vértebra atlas", "primeira vértebra cervical", "vértebra cervical C1"], explanation: "O atlas é a primeira vértebra cervical (C1) e se articula com o crânio." },
  { key: "Axis", name: "Vértebra cervical áxis", accepted: ["segunda vértebra cervical (áxis)"], incompleteAccepted: ["áxis", "C2", "vértebra áxis", "segunda vértebra cervical", "vértebra cervical C2"], explanation: "O áxis é a segunda vértebra cervical (C2), caracterizada pela presença do dente." },
  { key: "Vertebra_C7", name: "Sétima vértebra cervical (proeminente)", accepted: ["vértebra proeminente", "sétima vértebra cervical", "vértebra cervical C7"], incompleteAccepted: ["C7", "proeminente"], explanation: "C7 é conhecida como vértebra proeminente por seu processo espinhoso longo." },
  { key: "Vertebra_C4", name: "Vértebra cervical típica", accepted: ["vértebra cervical típica"], incompleteAccepted: ["vértebra cervical", "cervical típica", "cervical", "C4"], explanation: "O destaque corresponde a C4, um exemplo de vértebra cervical típica, com forames transversários." },
  { key: "Vertebra_T7", name: "Vértebra torácica", accepted: ["vértebra torácica"], incompleteAccepted: ["torácica", "T7"], explanation: "O destaque corresponde a T7, uma vértebra torácica que apresenta superfícies articulares para as costelas." },
  { key: "Vertebra_L3", name: "Vértebra lombar", accepted: ["vértebra lombar"], incompleteAccepted: ["lombar", "L3"], explanation: "O destaque corresponde a L3, uma vértebra lombar com corpo volumoso adaptado à sustentação de peso." },
  { key: "sacrum", name: "Osso sacro", accepted: ["osso sacro"], incompleteAccepted: ["sacro"], explanation: "O sacro resulta habitualmente da fusão de cinco vértebras sacrais." },
  { key: "Coccyx", name: "Osso cóccix", accepted: ["osso cóccix"], incompleteAccepted: ["cóccix"], explanation: "O cóccix é a porção terminal da coluna vertebral, abaixo do sacro." },
];

for (const [index, structure] of spineStructures.entries()) {
  const model: ModelId = index < 4 ? "spine-cervical-practice" : "spine-practice";
  const group = spineStructures.slice(index < 6 ? 0 : 2, index < 6 ? 6 : 8);
  for (let position = group.length - 1; position > 0; position--) {
    const other = Math.floor(Math.random() * (position + 1));
    [group[position], group[other]] = [group[other], group[position]];
  }
  const number = String(group.indexOf(structure) + 1);
  rawQuestions.push(
    {
      kind: "identify",
      model,
      title: `Qual número indica a estrutura: ${structure.name}?`,
      instruction: "Compare as peças soltas, gire o modelo e selecione o número da estrutura.",
      isolatedBones: group.map((item) => item.key),
      markers: group.map((item) => item.key),
      markerNames: group.map((item) => item.name),
      answer: number,
      accepted: [number],
      explanation: `O ponto ${number} indica ${structure.name}. ${structure.explanation}`,
    },
    {
      kind: "name",
      model,
      title: "Como se chama esta peça óssea isolada?",
      instruction: "Examine a peça solta de todos os lados e escreva seu nome anatômico completo.",
      isolatedBones: [structure.key],
      highlight: structure.key,
      answer: structure.name,
      accepted: [structure.name, ...structure.accepted],
      incompleteAccepted: structure.incompleteAccepted,
      explanation: structure.explanation,
    },
  );
}

rawQuestions.push({
  kind: "identify",
  model: "thorax-practice",
  title: "Qual número indica o corpo do esterno?",
  instruction: "Gire o tórax e selecione o ponto correspondente à parte alongada do esterno.",
  markers: ["Body of sternum", "Vertebra_T7", "Vertebra_L3", "sacrum", "1st_rib"],
  markerNames: ["o corpo do esterno", "a vértebra torácica T7", "a vértebra lombar L3", "o sacro", "a primeira costela"],
  answer: "1",
  accepted: ["1"],
  explanation: "O ponto 1 indica o corpo do esterno, sua porção intermediária e mais longa.",
}, {
  kind: "name",
  model: "thorax-practice",
  title: "Qual parte do esterno está destacada?",
  instruction: "Observe a parte alongada com contorno azul e escreva seu nome anatômico.",
  highlight: "Body of sternum",
  answer: "Corpo do esterno",
  accepted: ["corpo do esterno", "corpo esternal"],
  explanation: "O corpo do esterno é sua porção intermediária, entre o manúbrio e o processo xifoide.",
});


export const QUESTION_BANK: Question[] = [...rawQuestions.map<Question>((question, index) => ({
  ...question,
  id: `question-${index + 1}`,
  category: question.model?.startsWith("spine-") ? "spine"
    : question.model === "thorax-practice" ? "thorax" : "skull",
})), ...SIMULADO_PART_1, ...SIMULADO_PART_2, ...SIMULADO_PART_3,
...createMuscleQuestions(), ...P1_COMPLEMENT].map(muscleNamingQuestion)
  .map(alignProfessorQuestion).map(practicalQuestion);

export type TestConfig = {
  category?: Category | "all";
  kind?: Question["kind"] | "all";
  categories?: Category[];
  kinds?: Question["kind"][];
  review?: boolean;
  count: number;
};

export function filterQuestions(config: Omit<TestConfig, "count">) {
  return QUESTION_BANK.filter((question) =>
    (config.categories ? config.categories.includes(question.category)
      : !config.category || config.category === "all" || question.category === config.category) &&
    (config.kinds ? config.kinds.includes(question.kind)
      : !config.kind || config.kind === "all" || question.kind === config.kind),
  );
}

export function createTest(config: TestConfig, candidates = filterQuestions(config)): Question[] {
  const pool = [...candidates];
  for (let index = pool.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[other]] = [pool[other], pool[index]];
  }
  const count = Number.isFinite(config.count) ? Math.trunc(config.count) : 20;
  return pool.slice(0, Math.max(1, count));
}

export const normalizeAnswer = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bmm\.(?=\s|$)/g, "musculos")
    .replace(/\bm\.(?=\s|$)/g, "musculo")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!]$/, "");

export type AnswerStatus = "correct" | "incomplete" | "incorrect";

export function classifyAnswer(question: Question, answer: string): AnswerStatus {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return "incorrect";
  const matches = (values: string[]) => values.some(
    (value) => normalizeAnswer(value) === normalized,
  );
  if (question.answerGroups) {
    const parts = muscleListParts(answer, question.sourceNumber);
    const groups = question.answerGroups;
    const unordered = question.unorderedGroups
      ?? [31, 38, 40, 44, 45, 69].includes(question.sourceNumber ?? 0);
    if (matchesAnswerGroups(parts, groups, unordered)) return "correct";
    if (question.incompleteAnswerGroups) {
      const completeOrShort = groups.map((group, index) =>
        [...group, ...(question.incompleteAnswerGroups?.[index] ?? [])]);
      if (matchesAnswerGroups(parts, completeOrShort, unordered)) return "incomplete";
    }
  }
  if (matches([question.answer, ...question.accepted])) return "correct";
  if (question.kind !== "identify" && matches(question.incompleteAccepted ?? [])) {
    return "incomplete";
  }
  return "incorrect";
}

export const isCorrect = (question: Question, answer: string) =>
  classifyAnswer(question, answer) === "correct";

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

function muscleListParts(answer: string, sourceNumber?: number) {
  let value = normalizeAnswer(answer);
  const plural = sourceNumber === 31 && value.startsWith("musculos ");
  if (plural) value = value.replace(/^musculos /, "");
  const parts = value.split(/\s*(?:;|,|\be\b)\s*/i).filter(Boolean);
  return plural ? parts.map((part) => `musculo ${part}`) : parts;
}

function practicalQuestion(question: Question): Question {
  if (question.kind !== "name" || !question.highlight) return question;
  return {
    ...question,
    title: "Denomine a estrutura marcada.",
    instruction: question.model?.endsWith("-muscles-practice")
      ? "Gire a peça e identifique o músculo indicado pela bandeirinha azul."
      : "Gire a peça e identifique a estrutura indicada pela massinha azul.",
    explanation: question.explanation || question.title,
  };
}

function matchesAnswerGroups(parts: string[], groups: string[][], unordered: boolean) {
  if (parts.length !== groups.length) return false;
  const remaining = [...parts];
  return groups.every((group, index) => {
    if (!unordered) return group.some(term => normalizeAnswer(term) === parts[index]);
    const found = remaining.findIndex(part => group.some(term => normalizeAnswer(term) === part));
    if (found < 0) return false;
    remaining.splice(found, 1);
    return true;
  });
}
