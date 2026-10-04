import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { createViewer, type BoneSelection, type Viewer, type ViewerStatus } from "./viewer";
import { DEFAULT_MODEL, MODELS, type ModelId } from "./models";
import "./style.css";

function ViewerPage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [bone, setBone] = useState<BoneSelection | null>(null);

  useEffect(() => {
    viewer.current = createViewer(canvas.current!, setStatus, setBone);
    return () => viewer.current?.dispose();
  }, []);

  useEffect(() => viewer.current?.load(model), [model]);

  const message = status === "loading" ? "Carregando modelo 3D…" :
    status === "error" ? "Não foi possível carregar o modelo. Verifique a conexão e recarregue a página." : "";

  return <>
    <label id="model-control">Modelo <select id="model" value={model} onChange={(event) => setModel(event.currentTarget.value as ModelId)}>
      {MODELS.map(({ value, label }) => <option value={value}>{label}</option>)}
    </select></label>
    {message && <p id="status" role={status === "error" ? "alert" : "status"}>{message}</p>}
    {bone && <p id="bone-name" aria-live="polite" aria-label={`${bone.name}${bone.side ? `, lado ${bone.side === "D" ? "direito" : "esquerdo"}` : ""}`}>
      {bone.name}{bone.side && <span class="bone-side">{bone.side}</span>}
    </p>}
    <canvas ref={canvas} id="renderCanvas" aria-label="Modelo 3D de um crânio" />
  </>;
}

render(<ViewerPage />, document.getElementById("app")!);
