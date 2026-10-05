import { useState } from "preact/hooks";
import { QUESTIONS, isCorrect } from "../questions";

export function usePractice() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const question = QUESTIONS[index];
  const correct = isCorrect(question, answer);
  const score = answers.filter((value, answerIndex) =>
    isCorrect(QUESTIONS[answerIndex], value),
  ).length;

  function start() {
    setIndex(0);
    setAnswer("");
    setAnswers([]);
    setChecked(false);
  }

  function check() {
    if (!answer.trim() || checked) return;
    setAnswers((currentAnswers) => [...currentAnswers, answer]);
    setChecked(true);
  }

  function next() {
    if (index === QUESTIONS.length - 1) return true;
    setIndex((currentIndex) => currentIndex + 1);
    setAnswer("");
    setChecked(false);
    return false;
  }

  return {
    answer,
    answers,
    checked,
    check,
    correct,
    index,
    next,
    question,
    score,
    setAnswer,
    start,
  };
}
