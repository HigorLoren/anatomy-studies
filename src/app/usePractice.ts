import { useState } from "preact/hooks";
import { QUESTION_BANK, isCorrect, type Question } from "../questions";

export function usePractice() {
  const [questions, setQuestions] = useState<Question[]>(QUESTION_BANK.slice(0, 20));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const question = questions[index];
  const correct = isCorrect(question, answer);
  const score = questions.filter((item, position) =>
    isCorrect(item, answers[position] ?? ""),
  ).length;

  function goTo(position: number) {
    if (position < 0 || position >= questions.length) return;
    setIndex(position);
    setAnswer(answers[position] ?? "");
    setChecked(answers[position] !== undefined);
  }

  function start(selected: Question[] = questions, position = 0) {
    if (!selected.length) return;
    setQuestions(selected);
    setIndex(Math.max(0, Math.min(position, selected.length - 1)));
    setAnswer("");
    setAnswers([]);
    setChecked(false);
  }

  function saveAnswer(value: string) {
    if (checked) return;
    setAnswers((current) => {
      const updated = [...current];
      updated[index] = value;
      return updated;
    });
    setChecked(true);
  }

  function check() {
    if (answer.trim()) saveAnswer(answer);
  }

  function skip() {
    setAnswer("");
    saveAnswer("");
  }

  function next() {
    if (index === questions.length - 1) return true;
    goTo(index + 1);
    return false;
  }

  return {
    answer, answers, checked, check, correct, index, next, question,
    questions, score, setAnswer, start, goTo, skip,
  };
}
