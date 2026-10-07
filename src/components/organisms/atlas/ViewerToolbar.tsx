import type { ComponentChildren, RefObject } from "preact";
import { MODELS, type ModelId } from "../../../models";
import { ViewerIcon } from "./ViewerIcon";

type Props = {
  explore: boolean;
  marked: boolean;
  painting: boolean;
  onPaintingChange: (enabled: boolean) => void;
  model: ModelId;
  modelLabel: string;
  onModelChange?: (model: ModelId) => void;
  viewPicker?: ComponentChildren;
  fullscreen: boolean;
  fullscreenButtonRef: RefObject<HTMLButtonElement | null>;
  toggleFullscreen: () => void;
};

export function ViewerToolbar({
  explore, marked, model, modelLabel, onModelChange, viewPicker,
  fullscreen, fullscreenButtonRef, toggleFullscreen, painting, onPaintingChange,
}: Props) {
  const fullscreenLabel = fullscreen ? "Sair da tela cheia" : "Tela cheia";
  return (
    <>
      <div class="viewer-toolbar">
        {explore && onModelChange ? (
          <label class="viewer-model-picker">
            <span>Modelo anatômico</span>
            <select value={model} aria-label="Modelo anatômico"
              onChange={(event) => onModelChange(event.currentTarget.value as ModelId)}>
              {MODELS.map((option) =>
                <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        ) : <span class={`viewer-model-label ${marked ? "viewer-marked-label" : ""}`}>
          {marked ? "Estrutura marcada em azul" : modelLabel}
        </span>}
        {explore && viewPicker}
        <button ref={fullscreenButtonRef} type="button" aria-pressed={fullscreen}
          aria-label={fullscreenLabel} title={fullscreenLabel}
          onClick={toggleFullscreen} class="viewer-icon-button">
          <ViewerIcon name={fullscreen ? "collapse" : "expand"} />
        </button>
      </div>
      {explore && <label class="viewer-paint-toggle">
        <input type="checkbox" checked={painting}
          onChange={(event) => onPaintingChange(event.currentTarget.checked)} />
        Pintar estruturas
      </label>}
    </>
  );
}
