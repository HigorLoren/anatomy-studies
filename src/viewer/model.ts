import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import {
  ImportMeshAsync,
} from "@babylonjs/core/Loading/sceneLoader";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import type { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import type { Node } from "@babylonjs/core/node";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { createVertebraAppearance } from "./vertebraAppearance";
import { createPaintMaterials } from "./paintMaterials";
import { createIsolatedBones } from "./isolatedBones";
import { SPINE_PIECES, type ModelId } from "../models";
import { materialKey } from "./bones";
import type { Exercise, ViewerStatus } from "./types";

const NATURAL_MODEL = "overview-skull-natural";

type Options = {
  camera: ArcRotateCamera;
  fillLight: HemisphericLight;
  frameModel: () => void;
  keyLight: DirectionalLight;
  scene: Scene;
  setModel: (center: Vector3, radius: number) => void;
  setStatus: (value: ViewerStatus) => void;
  setupExercise: () => void;
  getExercise: () => Exercise;
};

export function createModelLoader(options: Options) {
  const { scene, setStatus, setupExercise } = options;
  const paintMaterials = createPaintMaterials(scene);
  const vertebraAppearance = createVertebraAppearance(scene);
  let replacements = new Map<string, PBRMaterial>();
  let currentNodes: Node[] = [];
  let loadId = 0;
  let layoutSignature = "";
  let arrange: ((keys: string[]) => void) | undefined;

  const load = async (
    model: ModelId,
    clearSelection: () => void,
  ) => {
    const requestId = ++loadId;
    const natural = model === NATURAL_MODEL;
    replacements = new Map();

    arrange = undefined;
    layoutSignature = "";
    setStatus("loading");

    try {
      const materials = await paintMaterials.load(model);
      if (usesBoneTexture(model)) await vertebraAppearance.load();

      if (requestId !== loadId) return;

      const imported = await importPracticeModel(model, scene);

      if (requestId !== loadId) {
        return dispose([...imported.meshes, ...imported.transformNodes]);
      }

      filterPracticeMeshes(model, imported.meshes);
      vertebraAppearance.apply(imported.meshes, usesBoneTexture(model));
      const nodes = mirrorRightGroups(imported.transformNodes, [
        ...imported.meshes,
        ...imported.transformNodes,
      ]);

      clearSelection();
      dispose(currentNodes);
      currentNodes = nodes;
      arrange = model.startsWith("spine-")
        ? createIsolatedBones(imported.meshes.filter((mesh) => !mesh.isDisposed()))
        : undefined;
      const display = model === "spine-pieces"
        ? { isolatedBones: SPINE_PIECES } : options.getExercise();
      const keys = display?.isolatedBones;
      if (keys?.length) {
        arrange?.(keys);
        layoutSignature = keys.join("|");
      }
      replacements = materials;
      configure(options, natural, display);
      setupExercise();
      setStatus("ready");
    } catch (error) {
      if (requestId === loadId) {
        console.error("Falha ao carregar o modelo:", error);
        setStatus("error");
      }
    }
  };

  return {
    load,
    get isolatedCount() { return layoutSignature ? layoutSignature.split("|").length : 0; },
    get naturalMaterials() { return replacements; },
    arrangeExercise(value: Exercise) {
      if (!arrange || !value?.isolatedBones?.length) return;
      const nextSignature = value.isolatedBones.join("|");
      if (layoutSignature === nextSignature) return;
      layoutSignature = nextSignature;
      arrange(value.isolatedBones);
      configure(options, false, value);
    },
    dispose: () => {
      ++loadId;
      paintMaterials.dispose();
      vertebraAppearance.dispose();
    },
  };
}

function mirrorRightGroups(groups: TransformNode[], nodes: Node[]) {
  for (const group of groups.filter((node) => node.name.endsWith("_right"))) {
    const left = group.clone(
      group.name.replace(/_right$/, "_left"),
      group.parent,
    );

    if (!left) continue;

    const mirrored = left as TransformNode;

    mirrored.scaling.x *= -1;
    nodes.push(mirrored);

    for (const mesh of mirrored.getChildMeshes()) {
      mesh.name = mesh.name.replace(`${group.name}.`, "").replace(/\.r$/, ".l");
    }
  }
  return nodes;
}

function configure(options: Options, natural: boolean, exercise: Exercise) {
  const {
    camera,
    fillLight: fill,
    frameModel: frame,
    keyLight: key,
    scene,
    setModel,
  } = options;

  const geometry = scene.meshes.filter((mesh) => mesh.getTotalVertices() > 0 && mesh.isEnabled());

  if (!geometry.length) {
    throw new Error("O arquivo não contém geometria visível.");
  }
  const [min, max] = bounds(geometry);
  const radius = max.subtract(min).length() / 2;

  fill.intensity = natural ? 0.8 : 1;
  key.intensity = natural ? 1.5 : 0.2;

  setModel(min.add(max).scale(0.505), radius);

  camera.alpha = exercise ? Math.PI / 2 : Math.PI / 2.9;
  camera.beta = (exercise?.isolatedBones?.length ?? 0) > 1
    ? 0.01
    : exercise?.isolatedBones ? Math.PI / 4 : Math.PI / 1.8;
  camera.minZ = radius / 100;
  camera.maxZ = radius * 100;
  camera.lowerRadiusLimit = radius * 0.3;
  camera.upperRadiusLimit = radius * 20;
  camera.wheelDeltaPercentage = 0.01;
  camera.panningSensibility = 2000 / radius;

  frame();
}

function bounds(meshes: Scene["meshes"]) {
  let min = new Vector3(Infinity, Infinity, Infinity);
  let max = new Vector3(-Infinity, -Infinity, -Infinity);

  for (const mesh of meshes) {
    mesh.computeWorldMatrix(true);
    const box = mesh.getBoundingInfo().boundingBox;
    min = Vector3.Minimize(min, box.minimumWorld);
    max = Vector3.Maximize(max, box.maximumWorld);
  }

  return [min, max];
}

function dispose(nodes: Node[]) {
  for (const node of nodes) {
    if (!node.isDisposed()) node.dispose();
  }
}

function modelFile(model: ModelId) {
  if (model === "spine-pieces" || model === "spine-cervical-practice") return "overview-skeleton";
  if (model === "spine-practice" || model === "thorax-practice") {
    return "pectoral-back-thorax-bones-costal-cart";
  }
  return model;
}

function filterPracticeMeshes(model: ModelId, meshes: Scene["meshes"]) {
  if (!model.startsWith("spine-")) return;
  for (const mesh of meshes) {
    const key = materialKey(mesh.material?.name ?? "");
    if (
      mesh.getTotalVertices() > 0 &&
      !/^(Atlas|Axis|Vertebra_[CTL]\d+|sacrum|Coccyx)$/.test(key)
    ) mesh.dispose();
  }
}

async function importPracticeModel(model: ModelId, scene: Scene) {
  const primary = await ImportMeshAsync(
    `${import.meta.env.BASE_URL}${modelFile(model)}.glb`, scene,
  );
  if (model !== "spine-practice") return primary;
  try {
    const cervical = await ImportMeshAsync(
      `${import.meta.env.BASE_URL}overview-skeleton.glb`, scene,
    );
    for (const mesh of cervical.meshes) {
      const key = materialKey(mesh.material?.name ?? "");
      if (mesh.getTotalVertices() > 0 && !/^(Atlas|Axis|Vertebra_C[3-7])$/.test(key)) {
        mesh.dispose();
      }
    }
    primary.meshes.push(...cervical.meshes.filter((mesh) => !mesh.isDisposed()));
    primary.transformNodes.push(...cervical.transformNodes);
    return primary;
  } catch (error) {
    dispose([...primary.meshes, ...primary.transformNodes]);
    throw error;
  }
}

function usesBoneTexture(model: ModelId) {
  return model === "spine-pieces" || model === "spine-practice" || model === "thorax-practice";
}
