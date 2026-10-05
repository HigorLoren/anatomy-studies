type ViewerControlsProps = { mode: "explore" | "quiz"; onReset: () => void };

export function ViewerControls({ mode, onReset }: ViewerControlsProps) {
  return (
    <div class="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 md:px-6 py-3 text-xs leading-5 text-slate-400">
      <span>
        <span class="inline-block">Arraste para girar</span> ·{" "}
        <span class="viewer-touch-hint">Pince para aproximar</span>
        <span class="viewer-mouse-hint">Role para aproximar</span> ·{" "}
        <span class="viewer-touch-hint">Arraste com 2 dedos para mover</span>
        <span class="viewer-mouse-hint">Segure Ctrl e arraste para mover a vista</span>
      </span>
      <button
        class="flex min-h-12 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-white/20 px-4 py-2 font-[inherit] text-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        type="button"
        onClick={onReset}
        aria-label={
          mode === "quiz"
            ? "Resetar visualização da questão"
            : "Resetar visualização"
        }
      >
        <span class="text-xl" aria-hidden="true">↺</span>
        <span>Resetar visualização</span>
      </button>
    </div>
  );
}
