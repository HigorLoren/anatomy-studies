import { MODELS, type ModelId } from "../models";
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
  const description = isSpine
    ? "Gire a coluna vertebral para observar as vértebras, o sacro e o cóccix. Use o zoom para examinar suas estruturas."
    : isThorax
      ? "Gire o tórax para observar as costelas, o esterno e as cartilagens costais. Use o zoom para examinar suas estruturas."
      : model === "exploded-skull"
        ? "Explore o crânio com os ossos separados para observar cada peça. Toque em um osso para destacá-lo e mostrar seu nome."
        : "Gire o crânio para observar suas estruturas. Toque em um osso para destacá-lo e mostrar seu nome.";
  const context = isSpine
    ? "Explore as estruturas das regiões cervical, torácica e lombar da coluna vertebral, além do sacro e do cóccix."
    : isThorax
      ? "Explore a caixa torácica e observe a relação entre as costelas, o esterno e a coluna vertebral."
      : "O crânio reúne estruturas do neurocrânio e do viscerocrânio. A prática usa os nomes do catálogo de estruturas anatômicas do projeto.";

  return (
    <>
      <AtlasViewer
        mode="explore"
        model={model}
        exercise={null}
        answer=""
        checked={false}
        questionIndex={questionIndex}
        onNumberSelect={() => {}}
        onStatus={onStatus}
      />
      <section class="flex items-center">
        <div class="w-full">
          <span class="mb-5 block text-sm font-medium text-accent">
            Exploração livre
          </span>
          <h1 class="mb-5 text-[clamp(2rem,3.2vw,3rem)] leading-[1.13] font-medium tracking-[-0.045em]">
            Cada osso,
            <br />
            uma descoberta.
          </h1>
          <p class="max-w-lg text-[16px] leading-7 text-muted">
            {description}
          </p>
          <label
            class="mb-3 block text-sm leading-6 font-medium mt-8"
            for="model"
          >
            Modelo anatômico
          </label>
          <select
            class="font-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-ink"
            id="model"
            value={model}
            onChange={(event) =>
              onModelChange(event.currentTarget.value as ModelId)
            }
          >
            {MODELS.map((option) => (
              <option value={option.value}>{option.label}</option>
            ))}
          </select>
          <div class="my-8 border-l-2 border-accent pl-5 text-sm leading-7 text-muted">
            {context}
          </div>
          <button
            class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent mt-6 flex min-h-14 items-center justify-between rounded-xl bg-ink px-5 py-4 text-sm font-medium text-white hover:bg-accent disabled:hover:bg-ink"
            onClick={onStart}
          >
            Praticar com questões
          </button>
        </div>
      </section>
    </>
  );
}
