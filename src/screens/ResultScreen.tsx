import { ResultAnswers } from "../components/organisms/ResultAnswers";
import { QUESTIONS } from "../questions";

type ResultScreenProps = {
  answers: string[];
  score: number;
  onRestart: () => void;
  onExplore: () => void;
};

export function ResultScreen({
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
            {score}
            <small class="text-3xl text-muted">/{QUESTIONS.length}</small>
          </strong>
          <span class="text-lg text-muted">respostas corretas</span>
        </div>
        {score === QUESTIONS.length && (
          <p class="max-w-lg text-[16px] font-medium text-accent">
            Você reconheceu todas as estruturas desta prática.
          </p>
        )}
        <ResultAnswers answers={answers} />
        <div class="flex justify-between mt-6 min-h-14">
          <button
            class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent flex items-center justify-between rounded-xl bg-ink px-5 py-4 text-sm font-medium text-white hover:bg-accent disabled:hover:bg-ink"
            onClick={onRestart}
          >
            Praticar novamente <span class="text-xl font-normal ml-1">↺</span>
          </button>
          <button
            class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-xl px-4 py-3 text-sm text-accent hover:bg-slate-200/60"
            onClick={onExplore}
          >
            Explorar o crânio livremente
          </button>
        </div>
      </div>
    </section>
  );
}
