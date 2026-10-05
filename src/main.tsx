import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  createViewer,
  type BoneSelection,
  type Marker,
  type Viewer,
  type ViewerStatus,
  type Exercise,
} from "./viewer";
import { DEFAULT_MODEL, MODELS, type ModelId } from "./models";
import { QUESTIONS, MARKER_BONES, isCorrect, explainAnswer } from "./questions";
import "./style.css";

function Atlas({
  mode,
  model,
  exercise,
  answer,
  checked,
  questionIndex,
  onNumberSelect,
  onStatus,
}: {
  mode: "explore" | "quiz";
  model: ModelId;
  exercise: Exercise;
  answer: string;
  checked: boolean;
  questionIndex: number;
  onNumberSelect: (answer: string) => void;
  onStatus: (status: ViewerStatus) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [bone, setBone] = useState<BoneSelection | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const selection = useRef({ checked, onNumberSelect });
  selection.current = { checked, onNumberSelect };
  useEffect(() => {
    viewer.current = createViewer(
      canvas.current!,
      (value) => {
        setStatus(value);
        onStatus(value);
      },
      setBone,
      setMarkers,
      (number) => {
        if (!selection.current.checked)
          selection.current.onNumberSelect(String(number));
      },
    );
    return () => viewer.current?.dispose();
  }, []);
  useEffect(() => {
    viewer.current?.load(model);
  }, [model]);
  useEffect(() => {
    viewer.current?.exercise(exercise);
  }, [exercise]);
  useEffect(() => {
    viewer.current?.reset(mode === "quiz" ? "question" : "default");
  }, [mode, questionIndex]);
  return (
    <section
      class={`relative flex flex-col overflow-hidden rounded-3xl bg-[#0a0d14] text-white ${mode === "quiz" ? "my-6 h-85 sm:h-90" : "min-h-120 lg:sticky lg:top-6 lg:h-[min(740px,calc(100dvh-160px))]"}`}
      aria-label="Visualização do crânio"
    >
      <div class="pointer-events-none absolute top-7 left-8 z-10 sm:top-5 sm:left-6">
        <span class="text-xs text-slate-400">Atlas interativo</span>
        <h2 class="mt-1 text-xl font-normal tracking-tight">Crânio humano</h2>
      </div>
      <div class="relative isolate min-h-0 flex-1 overflow-hidden">
        <canvas
          class="block h-full w-full touch-none outline-none"
          ref={canvas}
          id="renderCanvas"
          aria-label="Crânio 3D: arraste para girar e use a rolagem para aproximar"
        />
        {status === "ready" &&
          mode === "quiz" &&
          markers.map(
            (marker) =>
              marker.visible && (
                <button
                  class={`font-[inherit] cursor-pointer transition-colors disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white font-medium leading-none shadow-sm hover:bg-accent disabled:opacity-100 ${answer === String(marker.number) ? "bg-white text-ink ring-2 ring-white/30" : "bg-ink text-white"}`}
                  style={{
                    left: `${marker.x}%`,
                    top: `${marker.y}%`,
                    width: `${marker.size}px`,
                    height: `${marker.size}px`,
                    fontSize: `${Math.max(9, marker.size * 0.58)}px`,
                    borderWidth: `${marker.size < 20 ? 1 : 1.5}px`,
                  }}
                  aria-label={`Selecionar ponto ${marker.number}`}
                  disabled={checked}
                  onClick={() => onNumberSelect(String(marker.number))}
                >
                  {marker.number}
                </button>
              ),
          )}
        {status !== "ready" && (
          <div
            class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0d14] px-5 text-center text-sm text-slate-300"
            role={status === "error" ? "alert" : "status"}
          >
            {status === "loading" ? (
              <>
                <span class="size-6 animate-spin rounded-full border-2 border-slate-600 border-t-white motion-reduce:animate-none" />
                Preparando o crânio…
              </>
            ) : (
              <>
                Não foi possível abrir o modelo.
                <button
                  class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-lg border border-slate-500 px-4 py-2"
                  onClick={() => viewer.current?.load(model)}
                >
                  Tentar novamente
                </button>
              </>
            )}
          </div>
        )}
        {mode === "explore" && bone && (
          <div class="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-ink px-4 py-2 text-sm whitespace-nowrap">
            {bone.name}
            {bone.side && (
              <span class="ml-2 text-xs font-normal text-slate-400">
                {bone.side === "D" ? "direito" : "esquerdo"}
              </span>
            )}
          </div>
        )}
      </div>
      <div class="relative z-20 flex shrink-0 items-center justify-between gap-2 md:gap-3 border-t border-white/10 px-4 md:px-6 py-5 text-[11px] text-slate-400 sm:px-4 sm:py-3 sm:text-[10px]">
        <span>
          <span class="inline-block">Arraste para girar</span> ·{" "}
          <span class="inline-block">Role para aproximar</span>
        </span>
        <button
          class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent text-sm text-slate-300 hover:text-white"
          onClick={() =>
            viewer.current?.reset(mode === "quiz" ? "question" : "default")
          }
          aria-label={
            mode === "quiz"
              ? "Restaurar vista frontal da questão"
              : "Restaurar vista padrão"
          }
        >
          ↺ <span class="ml-1 text-[11px] sm:hidden">Restaurar vista</span>
        </button>
      </div>
    </section>
  );
}

function App() {
  const [mode, setMode] = useState<"intro" | "quiz" | "result" | "explore">(
    "intro",
  );
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const question = QUESTIONS[index];

  const correct = isCorrect(question, answer);

  const score = answers.filter((value, i) =>
    isCorrect(QUESTIONS[i], value),
  ).length;

  function start() {
    setIndex(0);
    setAnswer("");
    setAnswers([]);
    setChecked(false);
    setModel(DEFAULT_MODEL);
    setMode("quiz");
  }

  function check() {
    if (!answer.trim() || checked) return;
    setAnswers([...answers, answer]);
    setChecked(true);
  }

  function next() {
    if (index === QUESTIONS.length - 1) setMode("result");
    else {
      setIndex(index + 1);
      setAnswer("");
      setChecked(false);
    }
  }

  return (
    <div class="mx-auto max-w-[1600px] px-6 md:px-12">
      <header class="grid grid-cols-2 md:grid-cols-3 min-h-20 items-center gap-4 border-b border-slate-200 flex-wrap justify-center py-4">
        <a
          class="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent flex items-center gap-3 text-2xl font-semibold tracking-tight text-ink no-underline"
          href="./"
          aria-label="Anatomia, início"
        >
          <span class="flex size-9 items-center justify-center rounded-full bg-ink text-[28px] font-light text-white">
            a
          </span>
          anatomia
          <span class="ml-4 hidden border-l border-slate-300 pl-5 text-xs font-normal tracking-normal text-muted xl:block">
            Estudo em perspectiva
          </span>
        </a>
        <nav
          class="mx-auto flex gap-1 rounded-full bg-slate-200/50 p-1"
          aria-label="Modo de estudo"
        >
          <button
            class={`font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-full px-4 py-2 text-sm sm:px-3 sm:text-xs ${mode !== "explore" ? "bg-white font-medium text-ink shadow-sm" : "text-muted"}`}
            onClick={() =>
              setMode(
                answers.length === QUESTIONS.length
                  ? "result"
                  : answers.length
                    ? "quiz"
                    : "intro",
              )
            }
          >
            Praticar
          </button>
          <button
            class={`font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-full px-4 py-2 text-sm sm:px-3 sm:text-xs ${mode === "explore" ? "bg-white font-medium text-ink shadow-sm" : "text-muted"}`}
            onClick={() => setMode("explore")}
          >
            Explorar em 3D
          </button>
        </nav>
      </header>
      <main
        class={`grid gap-10 py-8 xl:gap-16 sm:gap-7 ${mode === "quiz" || mode === "result" ? "mx-auto max-w-3xl sm:pt-3" : "pt-6 lg:grid-cols-[1.15fr_1fr]"}`}
      >
        {mode === "intro" && (
          <div class="flex items-center justify-center overflow-hidden rounded-3xl bg-[#0a0d14] p-8">
            <img
              class="w-full max-w-110"
              src={`${import.meta.env.BASE_URL}skull-practice.png`}
              alt="Crânio humano visto de frente e de lado"
            />
          </div>
        )}
        {mode === "explore" && (
          <Atlas
            mode="explore"
            model={model}
            exercise={null}
            answer=""
            checked={false}
            questionIndex={index}
            onNumberSelect={setAnswer}
            onStatus={setStatus}
          />
        )}
        <section class="flex items-center">
          {mode === "intro" && (
            <div class="w-full">
              <span class="mb-5 block text-sm font-medium text-accent">
                Prática de anatomia
              </span>
              <h1 class="mb-5 text-[clamp(2rem,3.2vw,3rem)] leading-[1.13] font-medium tracking-[-0.045em]">
                Um novo olhar
                <br />
                sobre o crânio.
              </h1>
              <p class="max-w-lg text-[16px] leading-7 text-muted">
                Observe, identifique e descubra o que você já sabe sobre as
                estruturas da cabeça.
              </p>
              <div class="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-slate-200 py-4 text-sm text-muted">
                <span>
                  <strong class="mr-1 text-lg font-medium text-ink">5</strong>
                  questões
                </span>
                <span>
                  <strong class="mr-1 text-lg font-medium text-ink">3</strong>
                  formas de praticar
                </span>
                <span>
                  <strong class="mr-1 text-lg font-medium text-ink"></strong>Sem
                  limite de tempo
                </span>
              </div>
              <div class="my-8 space-y-4">
                <p class="grid grid-cols-[36px_1fr] gap-x-3">
                  <span class="row-span-2 pt-1 text-xl text-accent">01</span>
                  <b class="text-sm font-medium">Identifique no modelo</b>
                  <small class="mt-1 text-sm leading-5 text-muted">
                    Associe estruturas aos pontos numerados.
                  </small>
                </p>
                <p class="grid grid-cols-[36px_1fr] gap-x-3">
                  <span class="row-span-2 pt-1 text-xl text-accent">02</span>
                  <b class="text-sm font-medium">Dê nome às estruturas</b>
                  <small class="mt-1 text-sm leading-5 text-muted">
                    Reconheça os ossos destacados em 3D.
                  </small>
                </p>
                <p class="grid grid-cols-[36px_1fr] gap-x-3">
                  <span class="row-span-2 pt-1 text-xl text-accent">03</span>
                  <b class="text-sm font-medium">Complete a frase</b>
                  <small class="mt-1 text-sm leading-5 text-muted">
                    Conecte os nomes ao que você aprendeu.
                  </small>
                </p>
              </div>
              <button
                class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent mt-6 flex min-h-14 items-center justify-between rounded-xl bg-ink px-5 py-4 text-sm font-medium text-white hover:bg-accent disabled:hover:bg-ink"
                onClick={start}
              >
                Começar a prática
              </button>
            </div>
          )}
          {mode === "quiz" && (
            <div class="w-full">
              <div class="flex justify-between gap-4 text-xs text-muted">
                <span>
                  Questão {index + 1} de {QUESTIONS.length}
                </span>
                <span>
                  {question.kind === "identify"
                    ? "Identificação"
                    : question.kind === "name"
                      ? "Denominação"
                      : "Completar a frase"}
                </span>
              </div>
              <div
                class="mt-1 mb-6 flex gap-2"
                aria-label={`Questão ${index + 1} de ${QUESTIONS.length}`}
              >
                {QUESTIONS.map((_, i) => (
                  <span
                    class={`h-1 flex-1 rounded-full ${i <= index ? "bg-accent" : "bg-slate-200"}`}
                  />
                ))}
              </div>
              <h1 class="mb-2 text-[clamp(2rem,3vw,2.6rem)] leading-[1.13] font-medium tracking-[-0.045em]">
                {question.title}
              </h1>
              <p class="text-[14px] text-muted">{question.instruction}</p>
              {question.kind !== "complete" && (
                <Atlas
                  mode="quiz"
                  model={DEFAULT_MODEL}
                  exercise={
                    question.kind === "identify"
                      ? {
                          markers: MARKER_BONES,
                          highlight: answer
                            ? MARKER_BONES[Number(answer) - 1]
                            : undefined,
                          highlightColor: checked
                            ? correct
                              ? "green"
                              : "red"
                            : "blue",
                          correctHighlight:
                            checked && !correct
                              ? MARKER_BONES[Number(question.answer) - 1]
                              : undefined,
                        }
                      : { highlight: question.highlight }
                  }
                  answer={answer}
                  checked={checked}
                  questionIndex={index}
                  onNumberSelect={setAnswer}
                  onStatus={setStatus}
                />
              )}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  checked ? next() : check();
                }}
              >
                {question.kind === "identify" ? (
                  <fieldset
                    class="mt-5 border-0 p-0"
                    disabled={checked || status !== "ready"}
                  >
                    <legend class="mb-3 block text-sm leading-6 font-medium">
                      Selecione um número
                    </legend>
                    <div class="grid grid-cols-5 gap-3">
                      {MARKER_BONES.map((_, i) => (
                        <button
                          type="button"
                          class={`font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent h-13 rounded-xl border text-xl hover:border-accent ${answer === String(i + 1) ? "border-accent bg-accent text-white" : "border-slate-300 bg-white"}`}
                          aria-pressed={answer === String(i + 1)}
                          onClick={() => setAnswer(String(i + 1))}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ) : (
                  <>
                    <label
                      class="mb-3 block text-sm leading-6 font-medium mt-8"
                      for="answer"
                    >
                      {question.kind === "complete"
                        ? "Os ossos frontal, parietal, temporal e occipital pertencem ao…"
                        : "Nome da estrutura"}
                    </label>
                    <input
                      class="font-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-ink"
                      id="answer"
                      key={index}
                      value={answer}
                      onInput={(event) => setAnswer(event.currentTarget.value)}
                      placeholder={
                        question.kind === "complete"
                          ? "Complete com o termo anatômico"
                          : "Digite o nome do osso"
                      }
                      disabled={
                        checked ||
                        (question.kind !== "complete" && status !== "ready")
                      }
                      autoComplete="off"
                    />
                  </>
                )}
                {question.kind === "identify" && answer && (
                  <div
                    class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"
                    aria-live="polite"
                  >
                    <span class="flex items-center gap-2">
                      <i
                        class={`size-2.5 rounded-full ${
                          checked
                            ? correct
                              ? "bg-emerald-500"
                              : "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      />
                      {checked
                        ? correct
                          ? "Sua resposta está correta"
                          : "Sua escolha"
                        : "Osso selecionado no modelo"}
                    </span>
                    {checked && !correct && (
                      <span class="flex items-center gap-2">
                        <i class="size-2.5 rounded-full bg-emerald-500" />
                        Resposta correta
                      </span>
                    )}
                  </div>
                )}
                {checked && (
                  <div
                    class={`mt-6 rounded-xl border px-5 py-4 text-sm leading-6 ${correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-900"}`}
                    role="status"
                  >
                    <strong class="flex items-center gap-2">
                      <span
                        class="flex size-6 items-center justify-center rounded-full bg-current/10 text-xl leading-none"
                        aria-hidden="true"
                      >
                        {correct ? "✓" : "×"}
                      </span>
                      {correct ? "Resposta correta!" : "Resposta incorreta"}
                    </strong>
                    {!correct && (
                      <p class="mt-2 mb-0">
                        Resposta correta: <b>{question.answer}</b>
                      </p>
                    )}
                    <p class="mt-2 mb-0">{explainAnswer(question, answer)}</p>
                  </div>
                )}
                <button
                  class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent mt-6 flex min-h-14 items-center justify-between rounded-xl bg-ink px-5 py-4 text-sm font-medium text-white hover:bg-accent disabled:hover:bg-ink"
                  disabled={
                    !answer.trim() ||
                    (question.kind !== "complete" && status !== "ready")
                  }
                >
                  {checked
                    ? index === QUESTIONS.length - 1
                      ? "Ver resultado"
                      : "Próxima questão"
                    : "Conferir resposta"}
                </button>
              </form>
              <p class="mt-4 text-xs leading-5 text-muted">
                {checked
                  ? question.kind === "complete"
                    ? "Leia a explicação antes de continuar, se quiser."
                    : "Observe o modelo antes de continuar, se quiser."
                  : question.kind === "complete"
                    ? "Sem pressa. Pense no termo anatômico antes de responder."
                    : "Sem pressa. Explore o modelo antes de responder."}
              </p>
            </div>
          )}
          {mode === "result" && (
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
          )}
          {mode === "explore" && (
            <div class="w-full">
              <span class="mb-5 block text-sm font-medium text-accent">
                Exploração livre
              </span>
              <h1 class="mb-5 text-[clamp(2rem,3.2vw,3rem)] leading-[1.13] font-medium tracking-[-0.045em]">
                Cada osso,
                <br />
                uma descoberta.
              </h1>
              <p class="max-w-lg text-[16px] leading-7 text-muted">
                Gire o crânio para observar suas estruturas. No modo osso
                natural, toque em um osso para revelar sua cor e seu nome.
              </p>
              <label
                class="mb-3 block text-sm leading-6 font-medium mt-8"
                for="model"
              >
                Aparência do modelo
              </label>
              <select
                class="font-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-ink"
                id="model"
                value={model}
                onChange={(event) =>
                  setModel(event.currentTarget.value as ModelId)
                }
              >
                {MODELS.map((option) => (
                  <option value={option.value}>{option.label}</option>
                ))}
              </select>
              <div class="my-8 border-l-2 border-accent pl-5 text-sm leading-7 text-muted">
                O crânio reúne estruturas do neurocrânio e do viscerocrânio. A
                prática usa os nomes do catálogo de estruturas anatômicas do
                projeto.
              </div>
              <button
                class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent mt-6 flex min-h-14 items-center justify-between rounded-xl bg-ink px-5 py-4 text-sm font-medium text-white hover:bg-accent disabled:hover:bg-ink"
                onClick={start}
              >
                Praticar com questões
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

render(<App />, document.getElementById("app")!);
