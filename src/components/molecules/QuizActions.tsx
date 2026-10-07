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
    <div class="quiz-actions">
      {!checked && <button type="button" onClick={onSkip}
        class="quiz-skip">
        Não sei
      </button>}
      <button type="submit" disabled={!canSubmit}
        class="quiz-submit">
        {checked ? advance : "Conferir resposta"}
      </button>
    </div>
  );
}
