import { formatPoints, formatQuestions, points } from "../../app/learning";

type Props = {
  count: number; onCount: (count: number) => void; available: number;
  total: number; review: boolean; hasSession: boolean;
};
export function TestSummary({ count, onCount, available, total, review, hasSession }: Props) {
  return (
        <aside class="test-summary" aria-label="Resumo do teste">
          <h2>Seu teste</h2>
          <label class="test-count">Quantidade de questões
            <input type="number" min="1" max="20" value={count} onInput={event => {
              const value = event.currentTarget.valueAsNumber;
              onCount(Number.isFinite(value) ? Math.max(1, Math.min(20, Math.trunc(value))) : 1);
            }} />
          </label>
          <p class="test-availability" role="status" aria-live="polite">
            {formatQuestions(available)} nesta seleção.
          </p>
          <dl class="test-grade">
            <div><dt>Questões neste teste</dt><dd>{total}</dd></div>
            <div><dt>Valor por questão</dt><dd>{formatPoints(points(total))} pontos</dd></div>
            <div><dt>Nota máxima</dt><dd>10 pontos</dd></div>
          </dl>
          <p class="test-summary-note">A nota é dividida igualmente entre as questões.
            {total > 0 && 1000 % total !== 0 && " O valor exibido é arredondado; a nota usa o valor exato."}
          </p>
          {!total && <p class={`test-empty ${review ? "test-empty--review" : ""}`} role="status">
            {review ? "Não há erros para revisar nesta seleção. Amplie os filtros ou monte um novo teste."
              : "Selecione ao menos uma região e um tipo com perguntas disponíveis."}
          </p>}
          <button type="submit" class="test-start" disabled={!total}>
            {review ? "Começar revisão" : "Começar teste"}
          </button>
          {hasSession && <p class="test-summary-note">Começar um novo teste substitui o teste salvo.</p>}
        </aside>
  );
}
