import { useEffect, useRef, useState } from "preact/hooks";

export function useViewerFullscreen() {
  const sectionRef = useRef<HTMLElement>(null);
  const fullscreenButtonRef = useRef<HTMLButtonElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const button = fullscreenButtonRef.current;
    button?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
      if (event.key === "Tab") {
        const controls = Array.from(sectionRef.current?.querySelectorAll<HTMLElement>("button, select") ?? []);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      button?.focus();
    };
  }, [fullscreen]);

  return {
    sectionRef, fullscreenButtonRef, fullscreen,
    toggleFullscreen: () => setFullscreen((value) => !value),
  };
}
