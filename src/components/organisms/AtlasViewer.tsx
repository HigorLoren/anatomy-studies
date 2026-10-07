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
import { useViewerFullscreen } from "./atlas/useViewerFullscreen";
import { ViewerToolbar } from "./atlas/ViewerToolbar";
import { BoneLabel } from "./atlas/BoneLabel";
import { MarkerButtons } from "./atlas/MarkerButtons";
import { ViewerControls } from "./atlas/ViewerControls";
import { ViewerLoader } from "./atlas/ViewerLoader";

export type AtlasViewerProps = {
  mode: "explore" | "quiz";
  model: ModelId;
  onModelChange?: (model: ModelId) => void;
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
  onModelChange,
  exercise,
  answer,
  checked,
  questionIndex,
  onNumberSelect,
  onStatus,
}: AtlasViewerProps) {
  const { sectionRef, fullscreenButtonRef, fullscreen, toggleFullscreen } = useViewerFullscreen();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [bone, setBone] = useState<BoneSelection | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [painting, setPainting] = useState(false);
  const [fps, setFps] = useState<number | null>(null);

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

    return () => {
      viewerRef.current?.dispose();
    };
  }, [onStatus]);

  useEffect(() => {
    if (mode !== "explore") return;
    const timer = window.setInterval(() => {
      setFps(viewerRef.current?.fps() ?? null);
    }, 500);
    return () => window.clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    setPainting(false); viewerRef.current?.paint(false); viewerRef.current?.load(model);
  }, [model]);

  useEffect(() => viewerRef.current?.exercise(exercise), [exercise]);

  useEffect(
    () => viewerRef.current?.reset(mode === "quiz" ? "question" : "default"),
    [mode, questionIndex],
  );

  const modelLabel = viewerLabel(mode, model);

  const reset = () => {
    setPainting(false);
    viewerRef.current?.reset(mode === "quiz" ? "question" : "default");
  };

  return (
    <section
      ref={sectionRef}
      role={fullscreen ? "dialog" : undefined}
      aria-modal={fullscreen ? true : undefined}
      class={`atlas-viewer flex flex-col overflow-hidden bg-[#0a0d14] text-white ${fullscreen ? "fixed inset-0 z-50 h-dvh w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" : `relative rounded-3xl ${mode === "quiz" ? "my-6 h-85 sm:h-90" : "h-[75dvh] min-h-130 lg:h-[calc(100dvh-160px)] lg:min-h-150"}`}`}
      aria-label={`Visualização: ${modelLabel}`}
    >
      <ViewerToolbar
        explore={mode === "explore"} model={model} modelLabel={modelLabel}
        onModelChange={onModelChange} fps={status === "ready" ? fps : null}
        fullscreen={fullscreen} fullscreenButtonRef={fullscreenButtonRef}
        toggleFullscreen={toggleFullscreen} painting={painting}
        onPaintingChange={(enabled) => { setPainting(enabled); viewerRef.current?.paint(enabled); }}
      />
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

function viewerLabel(mode: "explore" | "quiz", model: ModelId) {
  if (mode === "quiz") return "Peça anatômica";
  if (model.startsWith("spine-")) return "Peças da coluna vertebral";
  if (model === "thorax-practice") return "Ossos do tórax";
  return model === "exploded-skull" ? "Crânio explodido" : "Crânio humano";
}
