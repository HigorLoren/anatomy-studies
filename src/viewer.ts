import "@babylonjs/loaders/glTF";
import { Ray } from "@babylonjs/core/Culling/ray";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import {
  ImportMeshAsync,
  LoadAssetContainerAsync,
} from "@babylonjs/core/Loading/sceneLoader";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import type { Node as BabylonNode } from "@babylonjs/core/node";
import { Scene } from "@babylonjs/core/scene";
import { applyNaturalBone } from "./naturalBone";
import type { ModelId } from "./models";

const SCENE_COLOR = new Color4(0.04, 0.05, 0.08, 1);
const NATURAL_MODEL = "overview-skull-natural";
const CAMERA_FRAME_PADDING = 0.9;
const DEFAULT_CAMERA_ALPHA = Math.PI / 2.9;
const DEFAULT_CAMERA_BETA = Math.PI / 1.8;

const materialKey = (name: string) => name.replace(/\.\d+$/, "");
const BONE_NAMES: Record<string, string> = {
  "Ethmoid Bone": "Osso Etmoide",
  "Frontal bone": "Osso Frontal",
  "Mandible bone": "Osso Mandíbula",
  "Occipital bone": "Osso Occipital",
  "Parietal bone": "Osso Parietal",
  "Sphenoid bone": "Osso Esfenoide",
  Vomer: "Osso Vômer",
  "Inferior nasal concha bone": "Osso Concha Nasal Inferior",
  "Lacrimal bone": "Osso Lacrimal",
  "Lower canine": "Osso Canino Inferior",
  "Lower first molar tooth": "Osso Primeiro Molar Inferior",
  "Lower first premolar": "Osso Primeiro Pré-Molar Inferior",
  "Lower lateral incisor": "Osso Incisivo Lateral Inferior",
  "Lower medial incisor": "Osso Incisivo Central Inferior",
  "Lower second molar tooth": "Osso Segundo Molar Inferior",
  "Lower second premolar": "Osso Segundo Pré-Molar Inferior",
  "Maxilla bone": "Osso Maxilar",
  "Nasal bone": "Osso Nasal",
  "Palatine bone": "Osso Palatino",
  "Temporal bone": "Osso Temporal",
  "Upper canine": "Osso Canino Superior",
  "Upper first molar tooth": "Osso Primeiro Molar Superior",
  "Upper first premolar": "Osso Primeiro Pré-Molar Superior",
  "Upper lateral incisor": "Osso Incisivo Lateral Superior",
  "Upper medial incisor": "Osso Incisivo Central Superior",
  "Upper second molar tooth": "Osso Segundo Molar Superior",
  "Upper second premolar": "Osso Segundo Pré-Molar Superior",
  "Zygomatic bone": "Osso Zigomático",
};
const boneSelection = (
  materialName: string,
  meshName: string,
): BoneSelection => {
  const key = materialKey(materialName).replace(/[._][lr]$/, "");
  const side =
    /(?:[._]l$|\bleft\b)/i.test(meshName) || /[._]l$/i.test(materialName)
      ? "E"
      : /(?:[._]r$|\bright\b)/i.test(meshName) || /[._]r$/i.test(materialName)
        ? "D"
        : null;
  return { name: BONE_NAMES[key] ?? key, side };
};
type ColorProfile = {
  albedoColor: Color3;
  metallic: number;
  roughness: number;
};

export type ViewerStatus = "loading" | "ready" | "error";
export type BoneSelection = { name: string; side: "E" | "D" | null };
export type Marker = {
  number: number;
  x: number;
  y: number;
  size: number;
  visible: boolean;
};
export type Exercise = {
  markers?: string[];
  highlight?: string;
  highlightColor?: "blue" | "red" | "green";
  correctHighlight?: string;
} | null;
export type Viewer = {
  load(model: ModelId): void;
  exercise(value: Exercise): void;
  reset(view?: "default" | "question"): void;
  dispose(): void;
};

export function createViewer(
  canvas: HTMLCanvasElement,
  setStatus: (status: ViewerStatus) => void,
  onBoneSelect: (bone: BoneSelection | null) => void,
  onMarkers: (markers: Marker[]) => void = () => {},
  onNumberSelect: (number: number) => void = () => {},
): Viewer {
  const engine = new Engine(canvas, true, {
    adaptToDeviceRatio: true,
    limitDeviceRatio: 2,
  });
  const scene = new Scene(engine);
  scene.clearColor = SCENE_COLOR;

  const camera = new ArcRotateCamera(
    "camera",
    DEFAULT_CAMERA_ALPHA,
    DEFAULT_CAMERA_BETA,
    2.5,
    Vector3.Zero(),
    scene,
  );
  camera.attachControl(canvas, true);
  camera.useNaturalPinchZoom = true;
  const fillLight = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  fillLight.intensity = 1.5;
  fillLight.groundColor = new Color3(0.12, 0.12, 0.12);
  const keyLight = new DirectionalLight(
    "key",
    new Vector3(-0.6, -1, -0.8),
    scene,
  );
  const lowerFillLight = new DirectionalLight(
    "lowerFill",
    new Vector3(0.8, 1, 0.5),
    scene,
  );
  lowerFillLight.intensity = 0.28;

  let exercise: Exercise = null;
  let markerSignature = "";
  const surfaceAnchors = new Map<string, Vector3>();
  let currentNodes: BabylonNode[] = [];
  const coloredBones = new Map<
    number,
    { original: PBRMaterial; colored: PBRMaterial }
  >();
  let modelRadius = 0;
  let modelCenter = Vector3.Zero();
  let loadId = 0;
  let natural = false;
  const colorPalette = new Map<string, ColorProfile>();
  let paletteLoad: Promise<void> | undefined;

  const loadColorPalette = () =>
    (paletteLoad ??= LoadAssetContainerAsync(
      `${import.meta.env.BASE_URL}overview-colored-skull.glb`,
      scene,
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
    }));

  scene.onPointerObservable.add(({ type, pickInfo }) => {
    if (type !== PointerEventTypes.POINTERTAP || !natural || !pickInfo?.hit)
      return;
    const mesh = pickInfo.pickedMesh;
    if (!(mesh?.material instanceof PBRMaterial)) return;
    if (exercise) {
      const name = materialKey(mesh.material.name).replace(/[._][lr]$/, "");
      const index = exercise.markers?.indexOf(name) ?? -1;
      if (index >= 0) onNumberSelect(index + 1);
      return;
    }
    const selected = coloredBones.get(mesh.uniqueId);
    if (selected) {
      mesh.material = selected.original;
      selected.colored.dispose();
      coloredBones.delete(mesh.uniqueId);
      onBoneSelect(null);
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
    onBoneSelect(boneSelection(original.name, mesh.name));
  });

  const frameModel = () => {
    if (!modelRadius) return;
    const verticalHalfFov = camera.fov / 2;
    const horizontalHalfFov = Math.atan(
      Math.tan(verticalHalfFov) * engine.getAspectRatio(camera),
    );
    camera.radius =
      (modelRadius / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov))) *
      CAMERA_FRAME_PADDING;
  };
  const resize = () => {
    engine.resize();
    frameModel();
  };
  window.addEventListener("resize", resize);
  engine.runRenderLoop(() => {
    scene.render();
    const viewport = camera.viewport.toGlobal(
      engine.getRenderWidth(),
      engine.getRenderHeight(),
    );
    // Project a model-relative diameter into CSS pixels so labels follow camera zoom.
    const projectedSize =
      (canvas.clientHeight * modelRadius * 0.09) /
      (2 * camera.radius * Math.tan(camera.fov / 2));
    const size = Math.round(Math.max(12, Math.min(28, projectedSize)) * 2) / 2;
    const markers = (exercise?.markers ?? []).map((name, index) => {
      const anchor = surfaceAnchors.get(name);
      if (!anchor)
        return { number: index + 1, x: 0, y: 0, size, visible: false };
      const point = Vector3.Project(
        anchor,
        Matrix.Identity(),
        scene.getTransformMatrix(),
        viewport,
      );
      return {
        number: index + 1,
        size,
        x: (point.x / engine.getRenderWidth()) * 100,
        y: (point.y / engine.getRenderHeight()) * 100,
        visible: point.z > 0 && point.z < 1,
      };
    });
    const signature = JSON.stringify(
      markers.map((marker) => ({
        ...marker,
        x: Math.round(marker.x * 10) / 10,
        y: Math.round(marker.y * 10) / 10,
      })),
    );
    if (signature !== markerSignature) {
      markerSignature = signature;
      onMarkers(markers);
    }
  });
  const configureExercise = () => {
    // Cast from the frontal side onto the actual bone triangles once, then keep
    // that surface point fixed as the camera moves. The mandible's volume center
    // lies in its opening, so aim at the lower body instead.
    surfaceAnchors.clear();
    for (const name of exercise?.markers ?? []) {
      const matches = scene.meshes.filter(
        (mesh) =>
          mesh.material &&
          materialKey(mesh.material.name).replace(/[._][lr]$/, "") === name &&
          mesh.getTotalVertices() > 0,
      );
      const mesh =
        matches.find((mesh) => /right|\.r$/.test(mesh.name)) ?? matches[0];
      if (!mesh) continue;
      const box = mesh.getBoundingInfo().boundingBox;
      const center = box.centerWorld;
      const extent = box.maximumWorld.subtract(box.minimumWorld);
      const aimY =
        name === "Mandible bone"
          ? box.minimumWorld.y + extent.y * 0.2
          : center.y;
      // Nearby rays cover irregular faces where the central ray crosses a gap.
      const offsets = [0, -0.1, 0.1, -0.2, 0.2, -0.35, 0.35];
      for (const dy of offsets) {
        for (const dx of offsets) {
          const origin = new Vector3(
            center.x + extent.x * dx,
            aimY + extent.y * dy,
            box.maximumWorld.z + modelRadius * 2,
          );
          const hit = scene.pickWithRay(
            new Ray(origin, new Vector3(0, 0, -1)),
            (candidate) => candidate === mesh,
          );
          if (hit?.pickedPoint) {
            surfaceAnchors.set(name, hit.pickedPoint.clone());
            break;
          }
        }
        if (surfaceAnchors.has(name)) break;
      }
    }
    for (const mesh of scene.meshes) {
      if (!(mesh.material instanceof PBRMaterial)) continue;
      const name = materialKey(mesh.material.name).replace(/[._][lr]$/, "");
      const colors = {
        blue: new Color3(0.03, 0.25, 0.6),
        red: new Color3(0.65, 0.03, 0.04),
        green: new Color3(0.02, 0.4, 0.16),
      };
      mesh.material.emissiveColor =
        exercise?.correctHighlight === name
          ? colors.green
          : exercise?.highlight === name
            ? colors[exercise.highlightColor ?? "blue"]
            : Color3.Black();
    }
  };

  return {
    exercise(value) {
      for (const mesh of scene.meshes) {
        const selected = coloredBones.get(mesh.uniqueId);
        if (selected) mesh.material = selected.original;
      }
      for (const { colored } of coloredBones.values()) colored.dispose();
      coloredBones.clear();
      exercise = value;
      onBoneSelect(null);
      configureExercise();
    },
    reset(view = "default") {
      camera.inertialAlphaOffset = 0;
      camera.inertialBetaOffset = 0;
      camera.inertialRadiusOffset = 0;
      camera.inertialPanningX = 0;
      camera.inertialPanningY = 0;
      camera.setTarget(modelCenter.clone());
      camera.alpha = view === "question" ? Math.PI / 2 : DEFAULT_CAMERA_ALPHA;
      camera.beta = view === "question" ? Math.PI / 1.8 : DEFAULT_CAMERA_BETA;
      frameModel();
    },
    async load(model) {
      const requestId = ++loadId;
      natural = false;
      onBoneSelect(null);
      setStatus("loading");
      try {
        const isNatural = model === NATURAL_MODEL;
        if (isNatural) await loadColorPalette();
        if (requestId !== loadId) return;
        const file = isNatural ? "overview-skull" : model;
        const { meshes, transformNodes } = await ImportMeshAsync(
          `${import.meta.env.BASE_URL}${file}.glb`,
          scene,
        );
        if (requestId !== loadId) {
          for (const node of [...meshes, ...transformNodes]) node.dispose();
          return;
        }
        const nodes = [...meshes, ...transformNodes];

        for (const group of transformNodes.filter((node) =>
          node.name.endsWith("_right"),
        )) {
          const left = group.clone(
            group.name.replace(/_right$/, "_left"),
            group.parent,
          );
          if (!left) continue;
          left.scaling.x *= -1;
          nodes.push(left);
          for (const mesh of left.getChildMeshes())
            mesh.name = mesh.name
              .replace(`${group.name}.`, "")
              .replace(/\.r$/, ".l");
        }
        for (const { colored } of coloredBones.values()) colored.dispose();
        coloredBones.clear();
        for (const node of currentNodes) if (!node.isDisposed()) node.dispose();
        currentNodes = nodes;

        const geometry = scene.meshes.filter(
          (mesh) => mesh.getTotalVertices() > 0,
        );
        if (!geometry.length)
          throw new Error("O arquivo não contém geometria visível.");
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
          for (const mesh of geometry)
            if (mesh.material instanceof PBRMaterial)
              materials.add(mesh.material);
          applyNaturalBone(materials, radius);
        }
        fillLight.intensity = isNatural ? 0.8 : 1;
        keyLight.intensity = isNatural ? 1.5 : 0.2;
        modelCenter = min.add(max).scale(0.505);
        camera.setTarget(modelCenter.clone());
        camera.alpha = exercise ? Math.PI / 2 : DEFAULT_CAMERA_ALPHA;
        camera.beta = exercise ? Math.PI / 1.8 : DEFAULT_CAMERA_BETA;
        camera.minZ = radius / 100;
        camera.maxZ = radius * 100;
        camera.lowerRadiusLimit = radius * 0.3;
        camera.upperRadiusLimit = radius * 20;
        camera.wheelDeltaPercentage = 0.01;
        camera.panningSensibility = 2000 / radius;
        modelRadius = radius;
        frameModel();
        natural = isNatural;
        configureExercise();
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
