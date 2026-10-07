import { useState } from "preact/hooks";
import type { ModelId } from "../models";
import { AtlasViewer } from "../components/organisms/AtlasViewer";
import { EXPLORATION_VIEWS, explorationDescription } from "../exploration";
import type { ViewerStatus } from "../viewer";

type ExploreScreenProps = {
  model: ModelId;
  questionIndex: number;
  onModelChange: (model: ModelId) => void;
  onStart: () => void;
  onStatus: (status: ViewerStatus) => void;
};

export function ExploreScreen({
  model, questionIndex, onModelChange, onStart, onStatus,
}: ExploreScreenProps) {
  const [selection, setSelection] = useState({ model, id: "" });
  const options = EXPLORATION_VIEWS[model];
  const view = options.find(option => selection.model === model && option.id === selection.id)
    ?? options[0];
  const viewPicker = options.length > 1 && <label class="viewer-model-picker viewer-piece-picker">
    <span>Peça ou camada</span>
    <select aria-label="Peça ou camada" value={view.id}
      onChange={event => setSelection({ model, id: event.currentTarget.value })}>
      {options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select>
  </label>;
  return <>
    <AtlasViewer
      mode="explore" onModelChange={onModelChange} model={model}
      exercise={view.exercise} viewPicker={viewPicker} answer="" checked={false}
      questionIndex={questionIndex} onNumberSelect={() => {}} onStatus={onStatus}
    />
    <section class="explore-context" aria-label="Sobre este modelo">
      <details>
        <summary>Atlas interativo <span class="text-muted">· Sobre o modelo</span></summary>
        <div class="explore-description">
          <p>{explorationDescription(model)}</p>
          <p>Toque em uma estrutura para destacá-la e ver seu nome.
            Ative “Pintar estruturas” para marcar as peças que estiver estudando.</p>
        </div>
      </details>
      <button type="button" onClick={onStart}>Praticar com questões</button>
    </section>
  </>;
}
