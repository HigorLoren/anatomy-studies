type ViewerControlsProps = { mode: "explore" | "quiz"; onReset: () => void };

export function ViewerControls({ mode, onReset }: ViewerControlsProps) {
  return (
    <div class="relative z-20 flex shrink-0 items-center justify-between gap-2 md:gap-3 border-t border-white/10 px-4 md:px-6 py-5 text-[11px] text-slate-400 sm:px-4 sm:py-3 sm:text-[10px]">
      <span>
        <span class="inline-block">Arraste para girar</span> ·{" "}
        <span class="inline-block sm:hidden">Pince para aproximar</span>
        <span class="hidden sm:inline-block">Role para aproximar</span> ·{" "}
        <span class="inline-block sm:hidden">Arraste com 2 dedos para mover</span>
        <span class="hidden sm:inline-block">Segure Ctrl e arraste para mover a vista</span>
      </span>
      <button
        class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent text-sm text-slate-300 hover:text-white"
        onClick={onReset}
        aria-label={
          mode === "quiz"
            ? "Restaurar vista frontal da questão"
            : "Restaurar vista padrão"
        }
      >
        ↺ <span class="ml-1 text-[11px] sm:hidden">Restaurar vista</span>
      </button>
    </div>
  );
}
