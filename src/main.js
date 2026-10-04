import "@babylonjs/loaders/glTF";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import { Scene } from "@babylonjs/core/scene";
import "./style.css";

const canvas = document.querySelector("#renderCanvas");
const engine = new Engine(canvas, true);
const scene = new Scene(engine);
scene.clearColor = new Color4(0.04, 0.05, 0.08, 1);

const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.2, 2.5, Vector3.Zero(), scene);
camera.attachControl(canvas, true);
new HemisphericLight("light", new Vector3(0, 1, 0), scene).intensity = 1.5;

engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());

const status = document.querySelector("#status");
const modelSelect = document.querySelector("#model");
let currentNodes = [];
let modelRadius = 0;

function frameModel() {
  if (!modelRadius) return;
  const verticalHalfFov = camera.fov / 2;
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * engine.getAspectRatio(camera));
  camera.radius = modelRadius / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov)) * 1.15;
}
window.addEventListener("resize", frameModel);

async function loadModel() {
  modelSelect.disabled = true;
  status.hidden = false;
  status.setAttribute("role", "status");
  status.textContent = "Carregando modelo 3D…";
  try {
    // Keep the previous model visible until the replacement loads successfully.
    const { meshes, transformNodes } = await ImportMeshAsync(
      `${import.meta.env.BASE_URL}${modelSelect.value}.glb`, scene,
    );
    const newNodes = [...meshes, ...transformNodes];
    // The source stores paired bones only on the right. Reflect that group
    // across the anatomical midline, preserving its glTF parent transform.
    for (const group of transformNodes.filter((node) => node.name.endsWith("_right"))) {
      const left = group.clone(group.name.replace(/_right$/, "_left"), group.parent);
      left.scaling.x *= -1;
      newNodes.push(left);
      for (const mesh of left.getChildMeshes()) {
        mesh.name = mesh.name.replace(`${group.name}.`, "").replace(/\.r$/, ".l");
      }
    }
    for (const node of currentNodes) {
      if (!node.isDisposed()) node.dispose();
    }
    currentNodes = newNodes;
    const geometry = scene.meshes.filter((mesh) => mesh.getTotalVertices() > 0);
    if (!geometry.length) throw new Error("O arquivo não contém geometria visível.");

    let min = new Vector3(Infinity, Infinity, Infinity);
    let max = new Vector3(-Infinity, -Infinity, -Infinity);
    for (const mesh of geometry) {
      mesh.computeWorldMatrix(true);
      const box = mesh.getBoundingInfo().boundingBox;
      min = Vector3.Minimize(min, box.minimumWorld);
      max = Vector3.Maximize(max, box.maximumWorld);
    }
    const center = min.add(max).scale(0.5);
    const radius = max.subtract(min).length() / 2;
    camera.setTarget(center);
    camera.minZ = radius / 100;
    camera.maxZ = radius * 100;
    camera.lowerRadiusLimit = radius * 0.3;
    camera.upperRadiusLimit = radius * 20;
    camera.wheelDeltaPercentage = 0.01;
    camera.panningSensibility = 1000 / radius;

    modelRadius = radius;
    frameModel();
    canvas.setAttribute("aria-label", `Modelo 3D de um crânio ${modelSelect.value === "overview-skull" ? "sem cores" : "colorido"}`);
    status.hidden = true;
  } catch (error) {
    console.error("Falha ao carregar o crânio:", error);
    status.textContent = "Não foi possível carregar o modelo. Verifique a conexão e recarregue a página.";
    status.setAttribute("role", "alert");
  } finally {
    modelSelect.disabled = false;
  }
}
modelSelect.addEventListener("change", loadModel);
await loadModel();
