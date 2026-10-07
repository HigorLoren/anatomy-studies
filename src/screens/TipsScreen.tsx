import { useState } from 'preact/hooks';
import { tipGroups, type Tip } from '../cheatsheet/content';
import { sources } from '../cheatsheet/sources';
import { Diagram } from '../cheatsheet/Diagram';
import '../cheatsheet/tips.css';

const normalize = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function TipsScreen() {
  const [query, setQuery] = useState('');
  function jumpTo(id: string) {
    setQuery('');
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView();
      const url = new URL(window.location.href);
      url.hash = id;
      window.history.replaceState(null, '', url);
    });
  }
  const needle = normalize(query.trim());
  const groups = tipGroups.map(group => ({ ...group,
    tips: group.tips.filter(tip => normalize([
      tip.title, tip.answer, tip.cue, tip.recognition, tip.trap,
    ].join(' ')).includes(needle)),
  })).filter(group => group.tips.length);
  const count = groups.reduce((total, group) => total + group.tips.length, 0);
  return <div class="tips-page">
    <header class="tips-intro">
      <div><h1>Dicas para não confundir</h1>
        <p>Macetes, referências na peça e as pegadinhas que valem uma segunda olhada.</p>
      </div>
      <label class="tips-search">Encontrar uma dúvida
        <input type="search" value={query} placeholder="Ex.: pia, rádio, menisco…"
          onInput={event => setQuery(event.currentTarget.value)} />
      </label>
    </header>
    <div class="tips-layout">
      <aside class="tips-index">
        <nav aria-label="Assuntos das dicas">
          {tipGroups.map(group => <a href={`#${group.id}`} key={group.id}
            onClick={event => { event.preventDefault(); jumpTo(group.id); }}>{group.title}</a>)}
          <a href="#dicas-fontes">Material e fontes</a>
        </nav>
      </aside>
      <div class="tips-content">
        <p class="tips-result" role="status">{count} tópicos
          {needle ? ` encontrados para “${query}”` : ' para consultar'}.</p>
        {!count && <div class="tips-empty">
          <h2>Nenhum tópico encontrado</h2><p>Tente uma palavra mais curta ou outro nome.</p>
          <button onClick={() => setQuery('')}>Limpar busca</button>
        </div>}
        {groups.map(group => <section class="tips-group" id={group.id} key={group.id}>
          <header><h2>{group.title}</h2><p>{group.intro}</p></header>
          {group.tips.map(tip => <TipCard key={tip.id} tip={tip} />)}
        </section>)}
        <SourcesNote />
      </div>
    </div>
  </div>;
}

function TipCard({ tip }: { tip: Tip }) {
  return <article class="tip" id={tip.id} aria-labelledby={`${tip.id}-title`}>
    <h3 id={`${tip.id}-title`}>{tip.title}</h3>
    <div class="tip-cue"><span>{tip.kind}</span><p>{tip.cue}</p></div>
    {tip.comparison && <TipComparison comparison={tip.comparison} />}
    <div class={(tip.diagram || tip.image) && !(tip.diagram && tip.image)
      ? 'tip-body tip-body--visual' : 'tip-body'}>
      <TipExplanation tip={tip} />
      <TipVisuals tip={tip} />
    </div>
    {tip.trap && <p class="tip-trap"><strong>Atenção</strong>{tip.trap}</p>}
    <details class="tip-sources"><summary>Conferir fontes</summary>
      <ul>{tip.sources.map(id => <li key={id}>
        <a href={sources[id].url} target="_blank" rel="noreferrer">{sources[id].label}</a>
      </li>)}</ul>
    </details>
  </article>;
}

function TipExplanation({ tip }: { tip: Tip }) {
  return <div>
    {tip.answer && <p>{tip.answer}</p>}
    {tip.recognition && <div class="tip-recognition">
      <strong>Na peça</strong>
      {Array.isArray(tip.recognition)
        ? <ol>{tip.recognition.map(step => <li key={step}>{step}</li>)}</ol>
        : <p>{tip.recognition}</p>}
    </div>}
  </div>;
}

function TipComparison({ comparison }: { comparison: NonNullable<Tip['comparison']> }) {
  return <div class="tip-comparison">
    <table><caption>Como diferenciar os ligamentos cruzados</caption>
      <thead><tr>{comparison.headers.map(header =>
        <th scope="col" key={header}>{header}</th>)}</tr></thead>
      <tbody>{comparison.rows.map(row => <tr key={row[0]}>
        <th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function TipVisuals({ tip }: { tip: Tip }) {
  const visuals = <>
    {tip.diagram && <Diagram id={tip.diagram} />}
    {tip.image && <TipImage image={tip.image} />}
  </>;
  return tip.diagram && tip.image
    ? <div class="tip-visual-pair">{visuals}</div> : visuals;
}

function TipImage({ image }: { image: NonNullable<Tip['image']> }) {
  const src = `${import.meta.env.BASE_URL}${image.src}`;
  return <figure class="tip-diagram tip-image">
    <img src={src} alt={image.alt} width={image.width} height={image.height} loading="lazy" />
    <a class="tip-diagram-expand" href={src} target="_blank" rel="noreferrer"
      aria-label={`Ampliar: ${image.alt}`}>Ampliar imagem</a>
    <figcaption>{image.caption}</figcaption>
  </figure>;
}

function SourcesNote() {
  return <section id="dicas-fontes" class="tips-sources-note">
    <h2>Material e fontes</h2>
    <p>As referências de anatomia e dos macetes estão nos links de cada tópico.
      OpenStax e Kenhub complementam as explicações e a identificação das estruturas.</p>
    <p>PAD aparece em material de ensino da UC San Diego; o modelo do donut recheado
      é da Universidade de Wisconsin. O gesto do rádio tem um relato de aluno,
      identificado como evidência anedótica. As demais dicas são associações de
      nomes, formas e movimentos.</p>
    <p>Os desenhos foram feitos para esta página e simplificam as relações
      anatômicas. Use os acidentes descritos para reconhecer a peça real.</p>
  </section>;
}
