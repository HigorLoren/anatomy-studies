import { classifyAnswer, normalizeAnswer, type Question } from "./questions";

export function answerIssue(question: Question, answer: string) {
  if (classifyAnswer(question, answer) === "correct" || question.kind === "identify") return "";
  if (!answer.trim()) return "Você não informou uma resposta. Esta questão não conta como acerto.";
  if (question.answerGroups) return groupIssue(question, answer);
  const candidates = [question.answer, ...question.accepted];
  const details = candidates.map((candidate) => missingWords(candidate, answer)).filter(Boolean);
  if (details.length) return details.sort((a, b) => a.length - b.length)[0];
  if (classifyAnswer(question, answer) === "incomplete") {
    return "Você informou apenas parte do nome anatômico. Use o nome completo indicado abaixo.";
  }
  return "O termo informado não corresponde à estrutura ou ao conceito pedido.";
}

function missingWords(expected: string, actual: string) {
  const words = normalizeAnswer(expected).split(" ");
  const given = normalizeAnswer(actual).split(" ");
  if (given.length >= words.length || !given.every((word) => words.includes(word))) return "";
  const remaining = [...words];
  for (const word of given) {
    const index = remaining.indexOf(word);
    if (index < 0) return "";
    remaining.splice(index, 1);
  }
  if (remaining.length === 1 && remaining[0] === "musculo") {
    return "Faltou a palavra “músculo” antes do nome. Você pode escrever “Músculo” ou “M.”.";
  }
  if (remaining.length === 1 && remaining[0] === "musculos") {
    return "Faltou a palavra “músculos” antes dos nomes. Você pode escrever “Músculos” ou “Mm.”.";
  }
  // Recupere a grafia original, com acentos, para mostrar a parte que faltou.
  const original = expected.split(" ").filter((word) => remaining.includes(normalizeAnswer(word)));
  return `Faltou completar o nome com: “${original.join(" ")}”.`;
}

function groupIssue(question: Question, answer: string) {
  const groups = question.answerGroups!;
  const parts = groupParts(question, answer);
  const remaining = groups.map((_, index) => index);
  const messages: string[] = [];
  const unknown: string[] = [];
  for (const part of parts) {
    const match = matchGroup(groups, remaining, part);
    if (match.index < 0) { unknown.push(part); continue; }
    remaining.splice(remaining.indexOf(match.index), 1);
    if (match.reason) messages.push(`No termo “${part}”: ${match.reason}`);
  }
  if (remaining.length) {
    const missing = remaining.map((index) => `“${groups[index][0]}”`).join(" e ");
    messages.push(`Faltou informar corretamente ${missing}.`);
  }
  if (unknown.length) messages.push(`Revise ${unknown.map((part) => `“${part}”`).join(" e ")}.`);
  if (messages.length) return messages.join(" ");
  return "Os termos estão corretos, mas foram colocados nas lacunas trocadas. " +
    "Respeite a associação de cada termo com a estrutura ou posição indicada na frase.";
}

function matchGroup(groups: string[][], remaining: number[], part: string) {
  for (const index of remaining) {
    if (groups[index].some((term) => normalizeAnswer(term) === part)) return { index, reason: "" };
  }
  for (const index of remaining) {
    for (const term of groups[index]) {
      const reason = missingWords(term, part);
      if (reason) return { index, reason };
    }
  }
  return { index: -1, reason: "" };
}

function groupParts(question: Question, answer: string) {
  let value = normalizeAnswer(answer);
  const plural = question.sourceNumber === 31 && value.startsWith("musculos ");
  if (plural) value = value.replace(/^musculos /, "");
  const parts = value.split(/\s*(?:;|,|\be\b)\s*/i).filter(Boolean);
  return plural ? parts.map((part) => `musculo ${part}`) : parts;
}
