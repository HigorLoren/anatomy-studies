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
  selectionSequence?: number;
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
  selectionSequence = 0,
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

  const selectionRef = useRef({ checked, onNumberSelect });

  selectionRef.current = { checked, onNumberSelect };

  useEffect(() => {
    viewerRef.current = createViewer(
      canvasRef.current!,
      (value) => { setStatus(value); onStatus(value); },
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
    setPainting(false); viewerRef.current?.paint(false); viewerRef.current?.load(model);
  }, [model]);

  useEffect(() => viewerRef.current?.exercise(exercise), [exercise]);

  useEffect(
    () => viewerRef.current?.reset(mode === "quiz" ? "question" : "default"),
    [mode, questionIndex],
  );

  useEffect(() => {
    if (selectionSequence > 0 && answer) viewerRef.current?.focusNumber(Number(answer));
  }, [selectionSequence, answer]);

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
      class={`atlas-viewer atlas-viewer--${mode}${fullscreen ? " atlas-viewer--fullscreen" : ""}`}
      aria-label={`Visualização: ${modelLabel}`}
    >
      <ViewerToolbar
        explore={mode === "explore"} marked={Boolean(exercise?.clayTarget)} model={model} modelLabel={modelLabel}
        onModelChange={onModelChange}
        fullscreen={fullscreen} fullscreenButtonRef={fullscreenButtonRef}
        toggleFullscreen={toggleFullscreen} painting={painting}
        onPaintingChange={(enabled) => { setPainting(enabled); viewerRef.current?.paint(enabled); }}
      />
      <div class="viewer-canvas-area">
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
      <ViewerControls mode={mode} ready={status === "ready"} onReset={reset}
        onZoom={() => viewerRef.current?.zoom(0.8)} />
    </section>
  );
}

function viewerLabel(mode: "explore" | "quiz", model: ModelId) {
  if (mode === "quiz") return "Peça anatômica";
  if (model.startsWith("spine-")) return "Peças da coluna vertebral";
  if (model === "thorax-practice") return "Ossos do tórax";
  return model === "exploded-skull" ? "Crânio explodido" : "Crânio humano";
}
