import type { RefObject } from "preact";
import { MODELS, type ModelId } from "../../../models";

type Props = {
  explore: boolean;
  painting: boolean;
  onPaintingChange: (enabled: boolean) => void;
  model: ModelId;
  modelLabel: string;
  onModelChange?: (model: ModelId) => void;
  fps: number | null;
  fullscreen: boolean;
  fullscreenButtonRef: RefObject<HTMLButtonElement | null>;
  toggleFullscreen: () => void;
};

export function ViewerToolbar({
  explore, model, modelLabel, onModelChange, fps,
  fullscreen, fullscreenButtonRef, toggleFullscreen, painting, onPaintingChange,
}: Props) {
  return (
      <div class={explore
        ? "flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6"
        : "pointer-events-none absolute top-5 right-6 left-6 z-10 flex items-center justify-between gap-3"}>
        <div class="min-w-0">
          <span class="text-xs text-slate-400">Atlas interativo</span>
          <h2 class="mt-1 text-lg font-normal tracking-tight">{modelLabel}</h2>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          {explore && fps !== null && (
            <span class="font-mono text-xs text-slate-400 tabular-nums" aria-label={`Taxa de quadros: ${fps} FPS`}>{fps} FPS</span>
          )}
          {explore && onModelChange && (
            <div>
              <label class="sr-only" for="atlas-model">Modelo anatômico</label>
              <select
                id="atlas-model"
                value={model}
                onChange={(event) => onModelChange(event.currentTarget.value as ModelId)}
                class="min-h-11 max-w-full rounded-lg border border-white/20 bg-[#151d2a] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {MODELS.map((option) => <option value={option.value}>{option.label}</option>)}
              </select>
            </div>
          )}
          {explore && (
            <label class="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-white/20 px-3 text-sm">
              <input type="checkbox" checked={painting}
                onChange={(event) => onPaintingChange(event.currentTarget.checked)} />
              Pintar
            </label>
          )}
          <button
              ref={fullscreenButtonRef}
              type="button"
              aria-pressed={fullscreen}
              onClick={toggleFullscreen}
              class="pointer-events-auto min-h-11 rounded-lg border border-white/20 px-3 text-sm text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {fullscreen ? "Sair da tela cheia" : "Tela cheia"}
          </button>
        </div>
      </div>
  );
}
