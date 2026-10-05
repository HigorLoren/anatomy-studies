import { MARKER_BONES } from "../../questions";

type MarkerPickerProps = {
  answer: string;
  disabled: boolean;
  onSelect: (answer: string) => void;
};

export function MarkerPicker({
  answer,
  disabled,
  onSelect,
}: MarkerPickerProps) {
  return (
    <fieldset class="mt-5 border-0 p-0" disabled={disabled}>
      <legend class="mb-3 block text-sm leading-6 font-medium">
        Selecione um número
      </legend>
      <div class="grid grid-cols-5 gap-3">
        {MARKER_BONES.map((_, index) => {
          const value = String(index + 1);
          return (
            <button
              type="button"
              class={`font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent h-13 rounded-xl border text-xl hover:border-accent ${answer === value ? "border-accent bg-accent text-white" : "border-slate-300 bg-white"}`}
              aria-pressed={answer === value}
              onClick={() => onSelect(value)}
            >
              {value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
