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
    <header class="app-header">
      <a
        class="app-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        href="./"
        aria-label="Anatomia, início"
      >
        <span class="app-brand-mark">
          a
        </span>
        anatomia
        <span class="ml-4 hidden border-l border-slate-300 pl-5 text-xs font-normal tracking-normal text-muted xl:block">
          Estudo em perspectiva
        </span>
      </a>
      <nav
        class="app-mode-nav"
        aria-label="Modo de estudo"
      >
        <button
          class={!isExplore ? "is-active" : ""}
          aria-pressed={!isExplore}
          onClick={onPractice}
        >
          Praticar
        </button>
        <button
          class={isExplore ? "is-active" : ""}
          aria-pressed={isExplore}
          onClick={onExplore}
        >
          Explorar 3D
        </button>
      </nav>
    </header>
  );
}
