import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Culling/ray";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { ImportMeshAsync, LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import type { Node as BabylonNode } from "@babylonjs/core/node";
import { Scene } from "@babylonjs/core/scene";
import { applyNaturalBone } from "./naturalBone";
import type { ModelId } from "./models";

const SCENE_COLOR = new Color4(0.04, 0.05, 0.08, 1);
const NATURAL_MODEL = "overview-skull-natural";
const CAMERA_FRAME_PADDING = 1.15;

const materialKey = (name: string) => name.replace(/\.\d+$/, "");
type ColorProfile = { albedoColor: Color3; metallic: number; roughness: number };

export type ViewerStatus = "loading" | "ready" | "error";
export type Viewer = { load(model: ModelId): void; dispose(): void };

export function createViewer(canvas: HTMLCanvasElement, setStatus: (status: ViewerStatus) => void): Viewer {
  const engine = new Engine(canvas, true, { adaptToDeviceRatio: true, limitDeviceRatio: 2 });
  const scene = new Scene(engine);
  scene.clearColor = SCENE_COLOR;

  const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.2, 2.5, Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  camera.useNaturalPinchZoom = true;
  const fillLight = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  fillLight.intensity = 1.5;
  fillLight.groundColor = new Color3(0.12, 0.12, 0.12);
  const keyLight = new DirectionalLight("key", new Vector3(-0.6, -1, -0.8), scene);
  const lowerFillLight = new DirectionalLight("lowerFill", new Vector3(0.8, 1, 0.5), scene);
  lowerFillLight.intensity = 0.28;

  let currentNodes: BabylonNode[] = [];
  const coloredBones = new Map<number, { original: PBRMaterial; colored: PBRMaterial }>();
  let modelRadius = 0;
  let loadId = 0;
  let natural = false;
  const colorPalette = new Map<string, ColorProfile>();
  let paletteLoad: Promise<void> | undefined;

  const loadColorPalette = () => paletteLoad ??= LoadAssetContainerAsync(
    `${import.meta.env.BASE_URL}overview-colored-skull.glb`, scene,
  ).then((container) => {
    for (const material of container.materials) {
      if (!(material instanceof PBRMaterial)) continue;
      colorPalette.set(materialKey(material.name), {
        albedoColor: material.albedoColor.clone(),
        metallic: material.metallic ?? 0,
        roughness: material.roughness ?? 1,
      });
    }
    container.dispose();
  });

  scene.onPointerObservable.add(({ type, pickInfo }) => {
    if (type !== PointerEventTypes.POINTERTAP || !natural || !pickInfo?.hit) return;
    const mesh = pickInfo.pickedMesh;
    if (!(mesh?.material instanceof PBRMaterial)) return;
    const selected = coloredBones.get(mesh.uniqueId);
    if (selected) {
      mesh.material = selected.original;
      selected.colored.dispose();
      coloredBones.delete(mesh.uniqueId);
      return;
    }

    const original = mesh.material;
    const color = colorPalette.get(materialKey(original.name));
    if (!color) return;
    const colored = new PBRMaterial(`colored-${mesh.name}`, scene);
    colored.albedoColor = color.albedoColor.clone();
    colored.metallic = color.metallic;
    colored.roughness = color.roughness;
    mesh.material = colored;
    coloredBones.set(mesh.uniqueId, { original, colored });
  });

  const frameModel = () => {
    if (!modelRadius) return;
    const verticalHalfFov = camera.fov / 2;
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * engine.getAspectRatio(camera));
    camera.radius = modelRadius / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov)) * CAMERA_FRAME_PADDING;
  };
  const resize = () => {
    engine.resize();
    frameModel();
  };
  window.addEventListener("resize", resize);
  engine.runRenderLoop(() => scene.render());

  return {
    async load(model) {
      const requestId = ++loadId;
      natural = false;
      setStatus("loading");
      try {
        const isNatural = model === NATURAL_MODEL;
        if (isNatural) await loadColorPalette();
        if (requestId !== loadId) return;
        const file = isNatural ? "overview-skull" : model;
        const { meshes, transformNodes } = await ImportMeshAsync(`${import.meta.env.BASE_URL}${file}.glb`, scene);
        if (requestId !== loadId) {
          for (const node of [...meshes, ...transformNodes]) node.dispose();
          return;
        }
        const nodes = [...meshes, ...transformNodes];

        for (const group of transformNodes.filter((node) => node.name.endsWith("_right"))) {
          const left = group.clone(group.name.replace(/_right$/, "_left"), group.parent);
          if (!left) continue;
          left.scaling.x *= -1;
          nodes.push(left);
          for (const mesh of left.getChildMeshes()) mesh.name = mesh.name.replace(`${group.name}.`, "").replace(/\.r$/, ".l");
        }
        for (const { colored } of coloredBones.values()) colored.dispose();
        coloredBones.clear();
        for (const node of currentNodes) if (!node.isDisposed()) node.dispose();
        currentNodes = nodes;

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
        const radius = max.subtract(min).length() / 2;
        if (isNatural) {
          const materials = new Set<PBRMaterial>();
          for (const mesh of geometry) if (mesh.material instanceof PBRMaterial) materials.add(mesh.material);
          applyNaturalBone(materials, radius);
        }
        fillLight.intensity = isNatural ? 0.8 : 1;
        keyLight.intensity = isNatural ? 1.5 : 0.2;
        camera.setTarget(min.add(max).scale(0.5));
        camera.minZ = radius / 100;
        camera.maxZ = radius * 100;
        camera.lowerRadiusLimit = radius * 0.3;
        camera.upperRadiusLimit = radius * 20;
        camera.wheelDeltaPercentage = 0.01;
        camera.panningSensibility = 1000 / radius;
        modelRadius = radius;
        frameModel();
        natural = isNatural;
        setStatus("ready");
      } catch (error) {
        if (requestId !== loadId) return;
        console.error("Falha ao carregar o crânio:", error);
        setStatus("error");
      }
    },
    dispose() {
      ++loadId;
      for (const { colored } of coloredBones.values()) colored.dispose();
      window.removeEventListener("resize", resize);
      engine.dispose();
    },
  };
}
