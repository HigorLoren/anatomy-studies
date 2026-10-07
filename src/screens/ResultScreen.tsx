import { ResultAnswers } from "../components/organisms/ResultAnswers";
import type { Question } from "../questions";
import { formatPoints, points } from "../app/learning";

type ResultScreenProps = {
  questions: Question[];
  answers: (string | null)[];
  score: number;
  onRestart: () => void;
  onExplore: () => void;
};

export function ResultScreen({
  questions,
  answers,
  score,
  onRestart,
  onExplore,
}: ResultScreenProps) {
  return (
    <section class="flex items-center">
      <div class="w-full">
        <h1 class="mb-5 text-[clamp(2rem,3.2vw,3rem)] font-bold tracking-[-0.045em]">
          Prática concluída
        </h1>
        <div class="my-7 flex items-center gap-6">
          <strong class="text-7xl font-medium tracking-tight text-accent">
            {formatPoints(score * points(questions.length))}
            <small class="text-3xl text-muted">/10</small>
          </strong>
          <span class="text-lg text-muted">{score} de {questions.length} respostas corretas<br />
            <small>{formatPoints(points(questions.length))} pontos por questão</small></span>
        </div>
        {score === questions.length && (
          <p class="max-w-lg text-[16px] font-medium text-accent">
            Você reconheceu todas as estruturas desta prática.
          </p>
        )}
        <ResultAnswers answers={answers} questions={questions} />
        <div class="flex justify-between mt-6 min-h-14">
          <button
            class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent flex items-center justify-between rounded-xl bg-ink px-5 py-4 text-sm font-medium text-white hover:bg-accent disabled:hover:bg-ink"
            onClick={onRestart}
          >
            Montar outro teste
          </button>
          <button
            class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-xl px-4 py-3 text-sm text-accent hover:bg-slate-200/60"
            onClick={onExplore}
          >
            Abrir banco de questões
          </button>
        </div>
      </div>
    </section>
  );
}
