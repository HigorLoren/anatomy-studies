import { render } from "preact";
import { useState } from "preact/hooks";
import { usePractice } from "./app/usePractice";
import type { ViewerStatus } from "./viewer";
import { AppHeader } from "./components/molecules/AppHeader";
import { ExploreScreen } from "./screens/ExploreScreen";
import { IntroScreen } from "./screens/IntroScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { DEFAULT_MODEL, type ModelId } from "./models";
import { QUESTIONS, isCorrect, explainAnswer } from "./questions";
import "./style.css";

function App() {
  const [mode, setMode] = useState<"intro" | "quiz" | "result" | "explore">(
    "intro",
  );
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const {
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
    start: resetPractice,
  } = usePractice();

  function start() {
    resetPractice();
    setModel(DEFAULT_MODEL);
    setMode("quiz");
  }

  function advance() {
    if (next()) setMode("result");
  }

  return (
    <div class="mx-auto max-w-[1600px] px-6 md:px-12">
      <AppHeader
        isExplore={mode === "explore"}
        onPractice={() =>
          setMode(
            answers.length === QUESTIONS.length
              ? "result"
              : answers.length
                ? "quiz"
                : "intro",
          )
        }
        onExplore={() => setMode("explore")}
      />
      <main
        class={`grid gap-10 py-8 xl:gap-16 sm:gap-7 ${mode === "quiz" || mode === "result" ? "mx-auto max-w-3xl sm:pt-3" : "pt-6 lg:grid-cols-[1.15fr_1fr]"}`}
      >
        {mode === "intro" && <IntroScreen onStart={start} />}
        {mode === "explore" && (
          <ExploreScreen
            model={model}
            questionIndex={index}
            onModelChange={setModel}
            onStart={start}
            onStatus={setStatus}
          />
        )}
        {mode === "quiz" && (
          <QuizScreen
            answer={answer}
            checked={checked}
            correct={correct}
            index={index}
            question={question}
            status={status}
            onAdvance={advance}
            onAnswer={setAnswer}
            onCheck={check}
            onStatus={setStatus}
          />
        )}
        {mode === "result" && (
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
              <div class="mt-6 border-t border-slate-200">
                {QUESTIONS.map((q, i) => (
                  <details class="border-b border-slate-200 py-3 text-[16px]">
                    <summary class="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent flex cursor-pointer items-center gap-3">
                      <span
                        class={
                          isCorrect(q, answers[i])
                            ? "text-lg text-emerald-700"
                            : "text-xl text-red-700"
                        }
                      >
                        {isCorrect(q, answers[i]) ? "✓" : "×"}
                      </span>
                      <span>{q.title}</span>
                    </summary>
                    <p class="ml-8 mt-3 text-sm leading-6 text-mist-700">
                      <b>Sua resposta:</b> {answers[i]}
                      <br />
                      <b>Resposta correta:</b> {q.answer}
                    </p>
                    <p class="ml-8 mt-3 text-sm leading-6 text-mist-700">
                      {explainAnswer(q, answers[i])}
                    </p>
                  </details>
                ))}
              </div>
              <div className="flex justify-between mt-6 min-h-14">
                <button
                  class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent flex items-center justify-between rounded-xl bg-ink px-5 py-4 text-sm font-medium text-white hover:bg-accent disabled:hover:bg-ink"
                  onClick={start}
                >
                  Praticar novamente{" "}
                  <span class="text-xl font-normal ml-1">↺</span>
                </button>
                <button
                  class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-xl px-4 py-3 text-sm text-accent hover:bg-slate-200/60"
                  onClick={() => setMode("explore")}
                >
                  Explorar o crânio livremente
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

render(<App />, document.getElementById("app")!);
