import { useState } from "preact/hooks";
import { AtlasViewer, type AtlasViewerProps } from "./AtlasViewer";
import { practicalHintBones } from "../../practicalHints";
import type { Question } from "../../questions";

type Props = AtlasViewerProps & { question: Question };

export function PracticalViewer({ question, ...viewerProps }: Props) {
  const [showHint, setShowHint] = useState(false);
  const neighbors = practicalHintBones(question);
  const exercise = showHint ? {
    ...viewerProps.exercise,
    isolatedBones: [...question.isolatedBones!, ...neighbors],
    preserveLayout: true,
  } : viewerProps.exercise;

  return (
    <>
      <AtlasViewer {...viewerProps} exercise={exercise} />
      {neighbors.length > 0 && (
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <button type="button" aria-pressed={showHint}
            class="rounded-xl border border-slate-300 px-4 py-2 text-sm text-accent"
            onClick={() => setShowHint((current) => !current)}>
            <span aria-hidden="true">✧</span>
            {showHint ? "Ocultar estruturas vizinhas" : "Mostrar estruturas vizinhas"}
          </button>
          {showHint && <p class="text-xs text-muted" role="status">
            Mostrando {neighbors.length === 1 ? "uma estrutura vizinha" : "duas estruturas vizinhas"}.
          </p>}
        </div>
      )}
    </>
  );
}
