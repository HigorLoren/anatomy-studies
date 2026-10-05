export const MARKER_BONES = [
  "Frontal bone",
  "Nasal bone",
  "Zygomatic bone",
  "Maxilla bone",
  "Mandible bone",
];

export type Question = {
  kind: "identify" | "name" | "complete";
  title: string;
  instruction: string;
  answer: string;
  accepted: string[];
  explanation: string;
  highlight?: string;
};

export const QUESTIONS: Question[] = [
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
    question.kind === "identify" ? MARKER_NAMES[Number(answer) - 1] : undefined;
  const selection =
    selectedBone && !isCorrect(question, answer)
      ? `Você selecionou ${selectedBone} (ponto ${answer}). `
      : "";
  return selection + question.explanation;
}
