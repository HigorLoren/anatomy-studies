type Props = {
  checked: boolean;
  index: number;
  total: number;
  free?: boolean;
  canSubmit: boolean;
  onSkip: () => void;
};

export function QuizActions({ checked, index, total, free, canSubmit, onSkip }: Props) {
  const advance = index === total - 1
    ? free ? "Voltar à primeira questão" : "Ver resultado"
    : "Próxima questão";
  return (
    <div class="mt-6 flex flex-wrap items-center gap-3">
      {!checked && <button type="button" onClick={onSkip}
        class="min-h-14 rounded-xl border border-slate-300 px-5 py-4 text-sm font-medium text-ink">
        Não sei
      </button>}
      <button type="submit" disabled={!canSubmit}
        class="min-h-14 rounded-xl bg-ink px-5 py-4 text-sm font-medium text-white disabled:opacity-45">
        {checked ? advance : "Conferir resposta"}
      </button>
    </div>
  );
}
