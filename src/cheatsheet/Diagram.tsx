import type { DiagramId } from './content';
const descriptions: Record<DiagramId, string> = {
  directions: 'Medial se aproxima do plano mediano; lateral se afasta.',
  planes: 'Sagital separa direita e esquerda; coronal separa anterior e posterior.',
  lobes: 'Mapa lateral dos lobos frontal, parietal, temporal e occipital.',
  meninges: 'Dura externa, aracnoide, espaço com líquor, pia acompanhando os sulcos.',
  brain: 'Relações entre telencéfalo, diencéfalo, tronco e cerebelo.',
  sternum: 'Manúbrio superior, corpo alongado e xifoide inferior.',
  atlas: 'Dente de C2 dentro do anel de C1, com medula posterior ao ligamento transverso.',
  arm: 'Úmero no braço, rádio do lado do polegar e ulna do lado do dedo mínimo.',
  pelvis: 'Ílio superior, ísquio posteroinferior e púbis anteroinferior.',
  joints: 'Fibras, cartilagem ou uma cavidade com líquido entre as superfícies.',
  disc: 'Anel fibroso por fora e núcleo pulposo no centro.',
  cruciates: 'Com o fêmur parado, LCA limita a tíbia indo para a frente; LCP, para trás.',
  menisci: 'Menisco medial em C, lateral quase circular.',
  quadriceps: 'Reto superficial central, vastos medial e lateral e intermédio profundo.',
};
export function Diagram({ id }: { id: DiagramId }) {
  return <figure class="tip-diagram">
    <img src={`${import.meta.env.BASE_URL}dicas/${id}.svg`} alt={descriptions[id]}
      width="600" height="330" loading="lazy" />
    <a class="tip-diagram-expand" href={`${import.meta.env.BASE_URL}dicas/${id}.svg`}
      target="_blank" rel="noreferrer" aria-label={`Ampliar: ${descriptions[id]}`}>
      Ampliar diagrama</a>
    <figcaption>Esquema didático, sem escala. {descriptions[id]}</figcaption>
  </figure>;
}
