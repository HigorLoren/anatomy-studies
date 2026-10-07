import { useState } from "preact/hooks";
import { AtlasViewer, type AtlasViewerProps } from "./AtlasViewer";
import { practicalHintBones } from "../../practicalHints";
import { muscleExposure, questionMuscleTarget } from "../../muscles";
import type { Question } from "../../questions";
import type { ComponentChildren } from "preact";

type Props = AtlasViewerProps & { question: Question; children: ComponentChildren };

export function PracticalViewer({ question, children, ...viewerProps }: Props) {
  const [showHint, setShowHint] = useState(false);
  const [exposeDeep, setExposeDeep] = useState(true);
  const target = questionMuscleTarget(question);
  const hasRemovedPieces = muscleExposure(target).length > 0;
  const muscleModel = Boolean(question.model?.endsWith("-muscles-practice"));
  const neighbors = practicalHintBones(question);
  const boneExercise = showHint ? {
    ...viewerProps.exercise,
    isolatedBones: [...question.isolatedBones!, ...neighbors],
    preserveLayout: true,
  } : viewerProps.exercise;
  const exercise = muscleModel
    ? { ...boneExercise, exposeDeepMuscles: exposeDeep, muscleTarget: target } : boneExercise;

  return (
    <div class="practical-workspace">
      <AtlasViewer {...viewerProps} exercise={exercise} />
      <aside class="practice-answer-panel" aria-label="Resposta da questão">
      {muscleModel && <div class="practice-hint">
        {hasRemovedPieces && <button type="button" aria-pressed={!exposeDeep} class="practice-hint-button"
          onClick={() => setExposeDeep((current) => !current)}>
          {exposeDeep ? "Mostrar peças removidas" : "Ocultar peças de cobertura"}
        </button>}
        <p class="text-xs text-muted">
          Gire a peça para ver os marcadores de cada lado.
          {exposeDeep && " A peça foi preparada para deixar os músculos à mostra."}
        </p>
      </div>}
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
