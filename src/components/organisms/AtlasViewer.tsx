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
import { BoneLabel } from "./atlas/BoneLabel";
import { MarkerButtons } from "./atlas/MarkerButtons";
import { ViewerControls } from "./atlas/ViewerControls";
import { ViewerLoader } from "./atlas/ViewerLoader";

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
        if (!selectionRef.current.checked) {
          selectionRef.current.onNumberSelect(String(number));
        }
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

  const modelLabel = model.startsWith("spine-") ? "Peças da coluna vertebral" : model === "thorax-practice" ? "Ossos do tórax" : "Crânio humano";

  const reset = () => {
    return viewerRef.current?.reset(mode === "quiz" ? "question" : "default");
  };

  return (
    <section
      class={`relative flex flex-col overflow-hidden rounded-3xl bg-[#0a0d14] text-white ${mode === "quiz" ? "my-6 h-85 sm:h-90" : "min-h-120 lg:sticky lg:top-6 lg:h-[min(740px,calc(100dvh-160px))]"}`}
      aria-label={`Visualização: ${modelLabel}`}
    >
      <div class="pointer-events-none absolute top-7 left-8 z-10 sm:top-5 sm:left-6">
        <span class="text-xs text-slate-400">Atlas interativo</span>
        <h2 class="mt-1 text-xl font-normal tracking-tight">{modelLabel}</h2>
      </div>
      <div class="relative isolate min-h-0 flex-1 overflow-hidden">
        <canvas
          class="block h-full w-full touch-none outline-none"
          ref={canvasRef}
          id="renderCanvas"
          aria-label={`${modelLabel} em 3D: arraste para girar e use a rolagem para aproximar`}
        />
        {status === "ready" && mode === "quiz" && (
          <MarkerButtons
            markers={markers}
            answer={answer}
            checked={checked}
            onNumberSelect={onNumberSelect}
          />
        )}
        <ViewerLoader
          status={status}
          onRetry={() => viewerRef.current?.load(model)}
        />
        {mode === "explore" && <BoneLabel bone={bone} />}
      </div>
      <ViewerControls mode={mode} onReset={reset} />
    </section>
  );
}
