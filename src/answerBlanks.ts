import type { Question } from "./questions";

export function hasAnswerBlanks(question: Question) {
  return question.title.includes("____");
}

export function allBlanksFilled(question: Question, answer: string) {
  const count = question.title.split("____").length - 1;
  if (!count) return Boolean(answer.trim());
  const values = answer.split(";");
  return values.length === count && values.every((value) => value.trim().length > 0);
}
