import { render } from "preact";
import { useState } from "preact/hooks";
import { usePractice } from "./app/usePractice";
import type { ViewerStatus } from "./viewer";
import { AppHeader } from "./components/molecules/AppHeader";
import { ExploreScreen } from "./screens/ExploreScreen";
import { IntroScreen } from "./screens/IntroScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { DEFAULT_MODEL, type ModelId } from "./models";
import { QUESTIONS } from "./questions";
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
          <ResultScreen
            answers={answers}
            score={score}
            onRestart={start}
            onExplore={() => setMode("explore")}
          />
        )}
      </main>
    </div>
  );
}

render(<App />, document.getElementById("app")!);
