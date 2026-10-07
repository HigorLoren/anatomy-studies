import { render } from "preact";
import { useState } from "preact/hooks";
import { usePractice } from "./app/usePractice";
import { useLearning } from "./app/useLearning";
import { testPool } from "./app/learning";
import type { ViewerStatus } from "./viewer";
import { QuestionNavigator } from "./components/molecules/QuestionNavigator";
import { AppHeader } from "./components/molecules/AppHeader";
import { ExploreScreen } from "./screens/ExploreScreen";
import { IntroScreen } from "./screens/IntroScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { QuestionBankScreen } from "./screens/QuestionBankScreen";
import { DEFAULT_MODEL, type ModelId } from "./models";
import { QUESTION_BANK, createTest, type TestConfig } from "./questions";
import "./style.css";

type Mode = "intro" | "quiz" | "result" | "explore" | "bank" | "free";

function App() {
  const [mode, setMode] = useState<Mode>("intro");
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const learning = useLearning();
  const test = usePractice(learning.data.session, learning.record, learning.saveSession);
  const free = usePractice(null, learning.record);

  const practice = mode === "free" ? free : test;

  function start(selected: TestConfig = learning.data.config) {
    const pool = testPool(selected, learning.data.records);
    const candidates = selected.review ? pool.slice(0, selected.count) : pool;
    const questions = createTest(selected, candidates);
    if (!questions.length) return;
    learning.saveConfig(selected);
    test.start(questions);
    setMode("quiz");
  }

  function openQuestion(id: string) {
    const index = QUESTION_BANK.findIndex((question) => question.id === id);
    if (index < 0) return;
    free.start(QUESTION_BANK, index);
    setMode("free");
  }

  function advance() {
    if (!practice.next()) return;
    if (mode === "free") free.goTo(0);
    else setMode("result");
  }

  return (
    <div class="app-shell mx-auto max-w-[1600px] px-4 md:px-8 xl:px-12">
      <AppHeader
        isExplore={mode === "explore"}
        onPractice={() => setMode("intro")}
        onExplore={() => setMode("explore")}
      />
      <main
        class={`grid gap-6 py-6 ${
          mode === "explore"
            ? "explore-main"
            : mode === "intro"
            ? "mx-auto w-full max-w-5xl pt-6 md:pt-12"
            : ["quiz", "free"].includes(mode)
            ? `practice-main practice-main--${mode} w-full`
            : "mx-auto w-full max-w-3xl sm:pt-3"
        }`}
      >
        {mode === "intro" && (
          <IntroScreen onStart={start} onBank={() => setMode("bank")}
            onResume={() => setMode("quiz")} progress={learning.data}
            storageError={learning.storageError} />
        )}
        {mode === "bank" && (
          <QuestionBankScreen
            onSelect={openQuestion}
            onTest={() => setMode("intro")}
          />
        )}
        {mode === "explore" && (
          <ExploreScreen
            model={model}
            questionIndex={test.index}
            onModelChange={setModel}
            onStart={() => setMode("intro")}
            onStatus={setStatus}
          />
        )}
        {(mode === "quiz" || mode === "free") && (
          <>
            {mode === "free" && (
              <div class="flex min-w-0 flex-wrap items-center gap-3">
                <button class="text-accent" onClick={() => setMode("bank")}>
                  ← Banco de questões
                </button>
                <QuestionNavigator index={free.index} onSelect={free.goTo} />
              </div>
            )}
            <QuizScreen
              key={mode}
              answer={practice.answer}
              checked={practice.checked}
              correct={practice.correct}
              index={practice.index}
              total={practice.questions.length}
              free={mode === "free"}
              question={practice.question}
              status={status}
              onAdvance={advance}
              onAnswer={practice.setAnswer}
              onCheck={practice.check}
              onSkip={practice.skip}
              onStatus={setStatus}
            />
          </>
        )}
        {mode === "result" && (
          <ResultScreen
            answers={test.answers}
            questions={test.questions}
            score={test.score}
            onRestart={() => setMode("intro")}
            onExplore={() => setMode("bank")}
          />
        )}
      </main>
    </div>
  );
}

render(<App />, document.getElementById("app")!);
