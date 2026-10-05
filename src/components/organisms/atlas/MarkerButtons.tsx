import type { Marker } from "../../../viewer";

type MarkerButtonsProps = {
  markers: Marker[];
  answer: string;
  checked: boolean;
  onNumberSelect: (answer: string) => void;
};

export function MarkerButtons({
  markers,
  answer,
  checked,
  onNumberSelect,
}: MarkerButtonsProps) {
  return markers.map(
    (marker) =>
      marker.visible && (
        <button
          class={`font-[inherit] cursor-pointer transition-colors disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white font-medium leading-none shadow-sm hover:bg-accent disabled:opacity-100 ${answer === String(marker.number) ? "bg-white text-ink ring-2 ring-white/30" : "bg-ink text-white"}`}
          style={{
            left: `${marker.x}%`,
            top: `${marker.y}%`,
            width: `${marker.size}px`,
            height: `${marker.size}px`,
            fontSize: `${Math.max(9, marker.size * 0.58)}px`,
            borderWidth: `${marker.size < 20 ? 1 : 1.5}px`,
          }}
          aria-label={`Selecionar ponto ${marker.number}`}
          disabled={checked}
          onClick={() => onNumberSelect(String(marker.number))}
        >
          {marker.number}
        </button>
      ),
  );
}
