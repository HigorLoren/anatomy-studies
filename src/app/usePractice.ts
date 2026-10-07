import { useLayoutEffect, useState } from "preact/hooks";
import { QUESTION_BANK, isCorrect, type Question } from "../questions";
import type { Session } from "./learning";

type Recorder = (id: string, correct: boolean) => void;
export function usePractice(
  initial?: Session | null, onRecord?: Recorder, onSession?: (session: Session | null) => void,
) {
  const [questions, setQuestions] = useState<Question[]>(() => initial
    ? initial.ids.map(id => QUESTION_BANK.find(question => question.id === id)!)
    : QUESTION_BANK.slice(0, 20));
  const [index, setIndex] = useState(initial?.index ?? 0);
  const [answer, setAnswer] = useState(initial?.draft ?? "");
  const [answers, setAnswers] = useState<(string | null)[]>(initial?.answers ?? []);
  const [checked, setChecked] = useState(initial?.answers[initial.index] != null);
  const [active, setActive] = useState(Boolean(initial));
  const question = questions[index];
  const correct = isCorrect(question, answer);
  const score = questions.filter((item, position) =>
    isCorrect(item, answers[position] ?? ""),
  ).length;

  useLayoutEffect(() => {
    if (!onSession) return;
    const session = { ids: questions.map(item => item.id), index, answers, draft: answer };
    onSession(active ? session : null);
  }, [active, questions, index, answers, answer, onSession]);

  function goTo(position: number) {
    if (position < 0 || position >= questions.length) return;
    setIndex(position);
    setAnswer(answers[position] ?? "");
    setChecked(answers[position] != null);
  }

  function start(selected: Question[] = questions, position = 0) {
    if (!selected.length) return;
    setQuestions(selected);
    setIndex(Math.max(0, Math.min(position, selected.length - 1)));
    setAnswer(""); setAnswers([]); setChecked(false); setActive(true);
  }

  function saveAnswer(value: string) {
    if (checked) return;
    setAnswers((current) => {
      const updated = [...current]; updated[index] = value; return updated;
    });
    onRecord?.(question.id, isCorrect(question, value));
    setChecked(true);
  }

  function check() { if (answer.trim()) saveAnswer(answer); }
  function skip() { setAnswer(""); saveAnswer(""); }
  function next() {
    if (index === questions.length - 1) { setActive(false); return true; }
    goTo(index + 1); return false;
  }

  return {
    answer, answers, checked, check, correct, index, next, question,
    questions, score, setAnswer, start, goTo, skip,
  };
}
