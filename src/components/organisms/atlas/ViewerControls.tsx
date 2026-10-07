import { useState } from "preact/hooks";
import { ViewerIcon } from "./ViewerIcon";

type ViewerControlsProps = {
  mode: "explore" | "quiz";
  ready: boolean;
  onReset: () => void;
  onZoom: () => void;
};

export function ViewerControls({ mode, ready, onReset, onZoom }: ViewerControlsProps) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div class="viewer-controls">
      <span class="viewer-short-help">
        Arraste para girar<br />
        <span class="viewer-touch-hint">Pince para aproximar</span>
        <span class="viewer-mouse-hint">Role para aproximar</span>
      </span>
      <div class="viewer-tools">
        {showHelp && <div id="viewer-gesture-help" class="viewer-gesture-help" role="status">
          <span class="viewer-touch-hint">Arraste para girar, pince para aproximar e use dois dedos para mover a peça.</span>
          <span class="viewer-mouse-hint">Arraste para girar, role para aproximar e segure Ctrl ao arrastar para mover a peça.</span>
        </div>}
        <button type="button" class="viewer-icon-button" aria-label="Como controlar a visualização"
          title="Como controlar a visualização" aria-expanded={showHelp} aria-controls={showHelp ? "viewer-gesture-help" : undefined}
          onClick={() => setShowHelp((value) => !value)}><ViewerIcon name="help" /></button>
        <button type="button" class="viewer-icon-button" disabled={!ready} onClick={onReset}
          aria-label={mode === "quiz" ? "Resetar visualização da questão" : "Resetar visualização"}
          title="Resetar visualização"><ViewerIcon name="reset" /></button>
        <button type="button" class="viewer-icon-button" disabled={!ready} onClick={onZoom}
          aria-label="Aproximar peça" title="Aproximar peça"><ViewerIcon name="zoom" /></button>
      </div>
    </div>
  );
}
