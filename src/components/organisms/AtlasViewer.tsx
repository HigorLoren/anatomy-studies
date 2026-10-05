import { useEffect, useRef, useState } from "preact/hooks";
import {
  createViewer,
  type BoneSelection,
  type Exercise,
  type Marker,
  type Viewer,
  type ViewerStatus,
} from "../../viewer";
import type { ModelId } from "../../models";

type AtlasViewerProps = {
  mode: "explore" | "quiz";
  model: ModelId;
  exercise: Exercise;
  answer: string;
  checked: boolean;
  questionIndex: number;
  onNumberSelect: (answer: string) => void;
  onStatus: (status: ViewerStatus) => void;
};

type MarkerButtonsProps = Pick<AtlasViewerProps, "answer" | "checked" | "onNumberSelect"> & {
  markers: Marker[];
};

function MarkerButtons({
  markers,
  answer,
  checked,
  onNumberSelect,
}: MarkerButtonsProps) {
  return markers.map(
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
  );
}

function ViewerLoader({ status, onRetry }: { status: ViewerStatus; onRetry: () => void }) {
  if (status === "ready") return null;

  return (
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
            onClick={onRetry}
          >
            Tentar novamente
          </button>
        </>
      )}
    </div>
  );
}

function BoneLabel({ bone }: { bone: BoneSelection | null }) {
  if (!bone) return null;

  return (
    <div class="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-ink px-4 py-2 text-sm whitespace-nowrap">
      {bone.name}
      {bone.side && (
        <span class="ml-2 text-xs font-normal text-slate-400">
          {bone.side === "D" ? "direito" : "esquerdo"}
        </span>
      )}
    </div>
  );
}

function ViewerControls({ mode, onReset }: { mode: AtlasViewerProps["mode"]; onReset: () => void }) {
  return (
    <div class="relative z-20 flex shrink-0 items-center justify-between gap-2 md:gap-3 border-t border-white/10 px-4 md:px-6 py-5 text-[11px] text-slate-400 sm:px-4 sm:py-3 sm:text-[10px]">
      <span>
        <span class="inline-block">Arraste para girar</span> · {" "}
        <span class="inline-block">Role para aproximar</span>
      </span>
      <button
        class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent text-sm text-slate-300 hover:text-white"
        onClick={onReset}
        aria-label={mode === "quiz" ? "Restaurar vista frontal da questão" : "Restaurar vista padrão"}
      >
        ↺ <span class="ml-1 text-[11px] sm:hidden">Restaurar vista</span>
      </button>
    </div>
  );
}

export function AtlasViewer({
  mode,
  model,
  exercise,
  answer,
  checked,
  questionIndex,
  onNumberSelect,
  onStatus,
}: AtlasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [bone, setBone] = useState<BoneSelection | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const selectionRef = useRef({ checked, onNumberSelect });
  selectionRef.current = { checked, onNumberSelect };

  useEffect(() => {
    viewerRef.current = createViewer(
      canvasRef.current!,
      (value) => {
        setStatus(value);
        onStatus(value);
      },
      setBone,
      setMarkers,
      (number) => {
        if (!selectionRef.current.checked)
          selectionRef.current.onNumberSelect(String(number));
      },
    );
    return () => viewerRef.current?.dispose();
  }, [onStatus]);
  useEffect(() => viewerRef.current?.load(model), [model]);
  useEffect(() => viewerRef.current?.exercise(exercise), [exercise]);
  useEffect(
    () => viewerRef.current?.reset(mode === "quiz" ? "question" : "default"),
    [mode, questionIndex],
  );

  const reset = () => viewerRef.current?.reset(mode === "quiz" ? "question" : "default");

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
          ref={canvasRef}
          id="renderCanvas"
          aria-label="Crânio 3D: arraste para girar e use a rolagem para aproximar"
        />
        {status === "ready" && mode === "quiz" && (
          <MarkerButtons
            markers={markers}
            answer={answer}
            checked={checked}
            onNumberSelect={onNumberSelect}
          />
        )}
        <ViewerLoader status={status} onRetry={() => viewerRef.current?.load(model)} />
        {mode === "explore" && <BoneLabel bone={bone} />}
      </div>
      <ViewerControls mode={mode} onReset={reset} />
    </section>
  );
}
