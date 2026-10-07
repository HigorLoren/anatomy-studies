type IconName = "expand" | "collapse" | "reset" | "zoom" | "help";

export function ViewerIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
    collapse: "M3 8h5V3m13 5h-5V3M8 21v-5H3m13 5v-5h5",
    reset: "M3 10a9 9 0 1 1 2 8M3 4v6h6",
    zoom: "M10 7v6m-3-3h6m2 5 6 6",
    help: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4m.1 3h.01",
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    {name === "zoom" && <circle cx="10" cy="10" r="7" />}
    {name === "help" && <circle cx="12" cy="12" r="9" />}
    <path d={paths[name]} />
  </svg>;
}
