type SelectionFeedbackProps = {
  answer: string;
  checked: boolean;
  correct: boolean;
};

export function SelectionFeedback({
  answer,
  checked,
  correct,
}: SelectionFeedbackProps) {
  if (!answer) return null;

  const color = checked
    ? correct
      ? "bg-emerald-500"
      : "bg-red-500"
    : "bg-blue-500";

  const label = checked
    ? correct
      ? "Sua resposta está correta"
      : "Sua escolha"
    : "Osso selecionado no modelo";

  return (
    <div
      class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"
      aria-live="polite"
    >
      <span class="flex items-center gap-2">
        <i class={`size-2.5 rounded-full ${color}`} />
        {label}
      </span>
      {checked && !correct && (
        <span class="flex items-center gap-2">
          <i class="size-2.5 rounded-full bg-emerald-500" />
          Resposta correta
        </span>
      )}
    </div>
  );
}
