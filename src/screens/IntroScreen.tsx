import { useState } from "preact/hooks";
import {
  CATEGORIES, QUESTION_BANK, QUESTION_KINDS, type Category, type Question, type TestConfig,
} from "../questions";
import { TestChoices } from "../components/molecules/TestChoices";
import { TestSummary } from "../components/molecules/TestSummary";
import { formatQuestions, testPool, type Learning } from "../app/learning";

type Props = {
  onStart: (config: TestConfig) => void; onBank: () => void; onResume: () => void;
  progress: Learning; storageError: boolean;
};
export function IntroScreen({ onStart, onBank, onResume, progress, storageError }: Props) {
  const [categories, setCategories] = useState<Category[]>(
    progress.config.categories ?? Object.keys(CATEGORIES) as Category[],
  );
  const [kinds, setKinds] = useState<Question["kind"][]>(
    progress.config.kinds ?? Object.keys(QUESTION_KINDS) as Question["kind"][],
  );
  const [count, setCount] = useState(progress.config.count);
  const [review, setReview] = useState(progress.config.review ?? false);
  const config = { categories, kinds, count, review };
  const available = testPool(config, progress.records).length;
  const total = Math.min(count, available);
  const pending = testPool({ review: true }, progress.records).length;
  const answered = Object.keys(progress.records).length;
  return <>
    <section aria-labelledby="test-title" class="test-setup">
      <div class="test-intro">
        <h1 id="test-title">Monte seu teste</h1>
        <p>Escolha o que quer revisar. Combine regiões e tipos de questão
          para preparar sua prática.</p>
      </div>
      {progress.session && <ResumeTest session={progress.session} onResume={onResume} />}
      <form class="test-builder" onSubmit={event => {
        event.preventDefault(); if (total) onStart(config);
      }}>
        <div class="test-filters">
          <fieldset class="test-source">
            <legend>Como quer praticar?</legend>
            <label class={review ? "" : "is-selected"}>
              <input type="radio" name="test-source" checked={!review}
                onChange={() => setReview(false)} />
              <span><strong>Montar um teste</strong>
                <small>Sorteie perguntas das regiões escolhidas.</small></span>
            </label>
            <label class={review ? "is-selected" : ""}>
              <input type="radio" name="test-source" checked={review}
                onChange={() => setReview(true)} />
              <span><strong>Revisar meus erros</strong><small>
                {pending ? `${formatQuestions(pending)} para tentar novamente.` : "Seus erros aparecerão aqui após praticar."}
              </small></span>
            </label>
            {review && <p class="test-summary-note">
              Inclui respostas erradas, incompletas e “Não sei”. Os erros mais frequentes
              têm prioridade. Ao acertar uma questão, ela sai da revisão.
            </p>}
          </fieldset>
          <TestChoices title="Regiões anatômicas" options={CATEGORIES} selected={categories}
            onChange={values => setCategories(values as Category[])} />
          <TestChoices title="Tipos de questão" options={QUESTION_KINDS} selected={kinds}
            onChange={values => setKinds(values as Question["kind"][])} />
        </div>
        <TestSummary count={count} onCount={setCount} available={available}
          total={total} review={review} hasSession={Boolean(progress.session)} />
      </form>
      <p class="test-progress-note" role="status">
        {storageError ? "Não foi possível salvar neste navegador. Seu progresso continua disponível nesta sessão."
          : `Questões praticadas: ${answered} · Para revisar: ${pending}. Seu progresso é salvo automaticamente neste navegador.`}
      </p>
    </section>
    <section aria-labelledby="bank-title" class="test-bank">
      <div><h2 id="bank-title">Base de perguntas</h2>
        <p>Explore as {QUESTION_BANK.length} perguntas e pratique uma questão por vez.</p></div>
      <button type="button" onClick={onBank}>Acessar base de perguntas</button>
    </section>
  </>;
}

function ResumeTest({ session, onResume }: {
  session: NonNullable<Learning["session"]>; onResume: () => void;
}) {
  return <div class="test-resume">
    <div><strong>Seu teste está salvo</strong><p>
      {session.answers.filter(value => value != null).length} de {session.ids.length}
      {" "}questões respondidas.
    </p></div>
    <button type="button" onClick={onResume}>Continuar teste</button>
  </div>;
}
