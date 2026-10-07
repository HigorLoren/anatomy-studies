import type { ModelId } from "../models";
import { AtlasViewer } from "../components/organisms/AtlasViewer";
import type { ViewerStatus } from "../viewer";

type ExploreScreenProps = {
  model: ModelId;
  questionIndex: number;
  onModelChange: (model: ModelId) => void;
  onStart: () => void;
  onStatus: (status: ViewerStatus) => void;
};

export function ExploreScreen({
  model,
  questionIndex,
  onModelChange,
  onStart,
  onStatus,
}: ExploreScreenProps) {
  const isSpine = model.startsWith("spine-");
  const isThorax = model === "thorax-practice";
  const description = model === "spine-pieces"
    ? "Compare as seis peças da coluna em uma grade de 3 colunas e 2 linhas. Gire a vista e toque em cada peça para ver seu nome."
    : isSpine
    ? "Gire a coluna vertebral para observar as vértebras, o sacro e o cóccix. Use o zoom para examinar suas estruturas."
    : isThorax
      ? "Gire o tórax para observar as costelas, o esterno e as cartilagens costais. Use o zoom para examinar suas estruturas."
      : model === "exploded-skull"
        ? "Explore o crânio com os ossos separados para observar cada peça. Toque em um osso para destacá-lo e mostrar seu nome."
        : "Gire o crânio para observar suas estruturas. Toque em um osso para destacá-lo e mostrar seu nome.";
  const context = model === "spine-pieces"
    ? "Compare atlas, áxis, C7 proeminente, uma vértebra cervical típica, uma torácica e uma lombar."
    : isSpine
    ? "Explore as estruturas das regiões cervical, torácica e lombar da coluna vertebral, além do sacro e do cóccix."
    : isThorax
      ? "Explore a caixa torácica e observe a relação entre as costelas, o esterno e a coluna vertebral."
      : "O crânio reúne estruturas do neurocrânio e do viscerocrânio. A prática usa os nomes do catálogo de estruturas anatômicas do projeto.";

  return (
    <>
      <AtlasViewer
        mode="explore"
        onModelChange={onModelChange}
        model={model}
        exercise={null}
        answer=""
        checked={false}
        questionIndex={questionIndex}
        onNumberSelect={() => {}}
        onStatus={onStatus}
      />
      <section class="explore-context" aria-label="Sobre este modelo">
        <details>
          <summary>Atlas interativo <span class="text-muted">· Sobre o modelo</span></summary>
          <div class="explore-description">
            <p>{description}</p>
            <p>{context}</p>
          </div>
        </details>
        <button type="button" onClick={onStart}>Praticar com questões <span aria-hidden="true">→</span></button>
      </section>
    </>
  );
}
