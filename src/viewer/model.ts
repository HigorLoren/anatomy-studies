import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import {
  ImportMeshAsync,
  LoadAssetContainerAsync,
} from "@babylonjs/core/Loading/sceneLoader";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import type { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import type { Node } from "@babylonjs/core/node";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { applyNaturalBone } from "./naturalBone";
import type { ModelId } from "../models";
import { materialKey } from "./bones";
import type { Exercise, ViewerStatus } from "./types";

const NATURAL_MODEL = "overview-skull-natural";

type ColorProfile = {
  albedoColor: PBRMaterial["albedoColor"];
  metallic: number;
  roughness: number;
};

type Options = {
  camera: ArcRotateCamera;
  fillLight: HemisphericLight;
  frameModel: () => void;
  keyLight: DirectionalLight;
  scene: Scene;
  setModel: (center: Vector3, radius: number) => void;
  setNatural: (value: boolean) => void;
  setStatus: (value: ViewerStatus) => void;
  setupExercise: () => void;
};

export function createModelLoader(options: Options) {
  const { scene, setNatural, setStatus, setupExercise } = options;
  const palette = new Map<string, ColorProfile>();
  let paletteLoad: Promise<void> | undefined;
  let currentNodes: Node[] = [];
  let loadId = 0;

  const loadPalette = () =>
    (paletteLoad ??= LoadAssetContainerAsync(
      `${import.meta.env.BASE_URL}overview-colored-skull.glb`,
      scene,
    ).then((container) => {
      for (const material of container.materials) {
        if (material instanceof PBRMaterial) {
          palette.set(materialKey(material.name), {
            albedoColor: material.albedoColor.clone(),
            metallic: material.metallic ?? 0,
            roughness: material.roughness ?? 1,
          });
        }
      }
      container.dispose();
    }));

  const load = async (
    model: ModelId,
    clearSelection: () => void,
    exercise: Exercise,
  ) => {
    const requestId = ++loadId;
    const natural = model === NATURAL_MODEL;

    setNatural(false);
    setStatus("loading");

    try {
      if (natural) await loadPalette();

      if (requestId !== loadId) return;

      const imported = await ImportMeshAsync(
        `${import.meta.env.BASE_URL}${modelFile(model)}.glb`,
        scene,
      );

      if (requestId !== loadId) {
        return dispose([...imported.meshes, ...imported.transformNodes]);
      }

      filterPracticeMeshes(model, imported.meshes);
      const nodes = mirrorRightGroups(imported.transformNodes, [
        ...imported.meshes,
        ...imported.transformNodes,
      ]);

      clearSelection();
      dispose(currentNodes);
      currentNodes = nodes;
      configure(options, natural, exercise);
      setNatural(natural);
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
    palette,
    dispose: () => {
      ++loadId;
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

  const geometry = scene.meshes.filter((mesh) => mesh.getTotalVertices() > 0);

  if (!geometry.length) {
    throw new Error("O arquivo não contém geometria visível.");
  }
  const [min, max] = bounds(geometry);
  const radius = max.subtract(min).length() / 2;

  if (natural) applyNaturalBone(materials(geometry), radius);

  fill.intensity = natural ? 0.8 : 1;
  key.intensity = natural ? 1.5 : 0.2;

  setModel(min.add(max).scale(0.505), radius);

  camera.alpha = exercise ? Math.PI / 2 : Math.PI / 2.9;
  camera.beta = exercise ? Math.PI / 1.8 : Math.PI / 1.8;
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

function materials(meshes: Scene["meshes"]) {
  const result = new Set<PBRMaterial>();

  for (const mesh of meshes) {
    if (mesh.material instanceof PBRMaterial) result.add(mesh.material);
  }

  return result;
}

function dispose(nodes: Node[]) {
  for (const node of nodes) {
    if (!node.isDisposed()) node.dispose();
  }
}

function modelFile(model: ModelId) {
  if (model === "spine-cervical-practice") return "overview-skeleton";
  if (model === "spine-practice" || model === "thorax-practice") {
    return "pectoral-back-thorax-bones-costal-cart";
  }
  return model === NATURAL_MODEL ? "overview-skull" : model;
}

function filterPracticeMeshes(model: ModelId, meshes: Scene["meshes"]) {
  if (model !== "spine-practice" && model !== "spine-cervical-practice") return;
  for (const mesh of meshes) {
    const key = materialKey(mesh.material?.name ?? "");
    if (
      mesh.getTotalVertices() > 0 &&
      !/^(Atlas|Axis|Vertebra_[CTL]\d+|sacrum|Coccyx)$/.test(key)
    ) mesh.dispose();
  }
}
