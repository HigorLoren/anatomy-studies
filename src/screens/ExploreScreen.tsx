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
      <section class="flex items-center">
        <div class="grid w-full gap-6 lg:grid-cols-[1fr_1.2fr_auto] lg:items-center">
          <div>
            <span class="mb-3 block text-sm font-medium text-accent">
              Exploração livre
            </span>
            <h1 class="mb-5 text-[clamp(2rem,3.2vw,3rem)] leading-[1.13] font-medium tracking-[-0.045em]">
              Cada osso,
              <br />
              uma descoberta.
            </h1>
          </div>
          <div>
            <p class="max-w-lg text-[16px] leading-7 text-muted">
              {description}
            </p>
            <div class="mt-4 border-l-2 border-accent pl-5 text-sm leading-7 text-muted">
              {context}
          </div>
          </div>
          <button
            class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent flex min-h-14 items-center justify-between rounded-xl bg-ink px-5 py-4 text-sm font-medium text-white hover:bg-accent disabled:hover:bg-ink"
            onClick={onStart}
          >
            Praticar com questões
          </button>
        </div>
      </section>
    </>
  );
}
