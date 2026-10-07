import { useState } from "preact/hooks";
import { AtlasViewer, type AtlasViewerProps } from "./AtlasViewer";
import { practicalHintBones } from "../../practicalHints";
import type { Question } from "../../questions";
import type { ComponentChildren } from "preact";

type Props = AtlasViewerProps & { question: Question; children: ComponentChildren };

export function PracticalViewer({ question, children, ...viewerProps }: Props) {
  const [showHint, setShowHint] = useState(false);
  const neighbors = practicalHintBones(question);
  const exercise = showHint ? {
    ...viewerProps.exercise,
    isolatedBones: [...question.isolatedBones!, ...neighbors],
    preserveLayout: true,
  } : viewerProps.exercise;

  return (
    <div class="practical-workspace">
      <AtlasViewer {...viewerProps} exercise={exercise} />
      <aside class="practice-answer-panel" aria-label="Resposta da questão">
      {neighbors.length > 0 && (
        <div class="practice-hint">
          <button type="button" aria-pressed={showHint}
            class="practice-hint-button"
            onClick={() => setShowHint((current) => !current)}>
            <span aria-hidden="true">✧</span>
            {showHint ? "Ocultar estruturas vizinhas" : "Mostrar estruturas vizinhas"}
          </button>
          {showHint && <p class="text-xs text-muted" role="status">
            Mostrando {neighbors.length === 1 ? "uma estrutura vizinha" : "duas estruturas vizinhas"}.
          </p>}
        </div>
      )}
      {children}
      </aside>
    </div>
  );
}
