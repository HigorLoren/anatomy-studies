type AppHeaderProps = {
  isExplore: boolean;
  onPractice: () => void;
  onExplore: () => void;
};

export function AppHeader({
  isExplore,
  onPractice,
  onExplore,
}: AppHeaderProps) {
  return (
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
          class={`font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-full px-4 py-2 text-sm sm:px-3 sm:text-xs ${!isExplore ? "bg-white font-medium text-ink shadow-sm" : "text-muted"}`}
          onClick={onPractice}
        >
          Praticar
        </button>
        <button
          class={`font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-full px-4 py-2 text-sm sm:px-3 sm:text-xs ${isExplore ? "bg-white font-medium text-ink shadow-sm" : "text-muted"}`}
          onClick={onExplore}
        >
          Explorar em 3D
        </button>
      </nav>
    </header>
  );
}
