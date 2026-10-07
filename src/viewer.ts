import "@babylonjs/loaders/glTF";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { attachTrackball } from "./viewer/trackball";
import { practiceView } from "./viewer/practiceView";
import { focusPiece } from "./viewer/focusPiece";
import { createExercise } from "./viewer/exercise";
import { createMarkers } from "./viewer/markers";
import { createModelLoader } from "./viewer/model";
import { applyMuscleLayer } from "./viewer/muscleMeshes";
import type {
  BoneSelection,
  Exercise,
  Marker,
  Viewer,
  ViewerStatus,
} from "./viewer/types";
export type {
  BoneSelection,
  Exercise,
  Marker,
  Viewer,
  ViewerStatus,
} from "./viewer/types";

const SCENE_COLOR = new Color4(0.04, 0.05, 0.08, 1);
const CAMERA_FRAME_PADDING = 1.15;

export function createViewer(
  canvas: HTMLCanvasElement,
  setStatus: (status: ViewerStatus) => void,
  onBoneSelect: (bone: BoneSelection | null) => void,
  onMarkers: (markers: Marker[]) => void = () => {},
  onNumberSelect: (number: number) => void = () => {},
): Viewer {
  const engine = new Engine(canvas, true, { adaptToDeviceRatio: true, limitDeviceRatio: 2 });
  const scene = new Scene(engine);
  scene.clearColor = SCENE_COLOR;
  const camera = new ArcRotateCamera(
    "camera", Math.PI / 2.9, Math.PI / 1.8, 2.5, Vector3.Zero(), scene,
  );
  camera.attachControl(canvas, true);
  const trackball = attachTrackball(canvas, camera);
  camera.useNaturalPinchZoom = true;
  const fillLight = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  fillLight.intensity = 1.5;
  fillLight.groundColor = new Color3(0.12, 0.12, 0.12);

  const keyLight = new DirectionalLight(
    "key",
    new Vector3(-0.6, -1, -0.8),
    scene,
  );

  const lowerFill = new DirectionalLight(
    "lowerFill",
    new Vector3(0.8, 1, 0.5),
    scene,
  );
  lowerFill.intensity = 0.28;

  let center = Vector3.Zero();
  let radius = 0;
  let halfSize = Vector3.Zero();

  const frameModel = () => frameCamera(camera, engine, radius, halfSize);
  const markers = createMarkers({ canvas, camera, engine, scene, onMarkers });
  const exercise = createExercise(scene, onBoneSelect);

  const setupExercise = () => {
    applyExerciseMuscleLayer(scene, exercise.value);
    trackball.setExercise(exercise.value);
    markers.configure(exercise.value, radius);
    exercise.highlight();
    focusPiece(scene, camera, exercise.value);
  };

  const loader = createModelLoader({
    camera,
    fillLight,
    frameModel,
    keyLight,
    scene,
    setModel: (nextCenter, nextRadius, nextHalfSize) => {
      center = nextCenter;
      radius = nextRadius;
      halfSize = nextHalfSize;
      camera.upVector = Vector3.Up();
      camera.setTarget(center.clone());
    },
    setStatus,
    setupExercise, getExercise: () => exercise.value,
  });

  const resize = () => { engine.resize(); frameModel(); };

  window.addEventListener("resize", resize);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  engine.runRenderLoop(() => {
    scene.render();
    markers.render(exercise.value, radius);
  });

  scene.onPointerObservable.add(({ type, pickInfo }) => {
    if (
      type === PointerEventTypes.POINTERTAP &&
      pickInfo?.hit &&
      pickInfo.pickedMesh
    )
      exercise.choose(pickInfo.pickedMesh, loader.naturalMaterials, onNumberSelect);
  });

  return {
    fps: () => Math.round(engine.getFps()), paint: exercise.paint,
    zoom: (factor) => zoomCamera(camera, factor),
    exercise(value) {
      loader.arrangeExercise(value);
      exercise.set(value, setupExercise);
    },
    reset(view = "default") {
      if (!exercise.value) { exercise.clear(); exercise.paint(false); }
      Object.assign(camera, {
        inertialAlphaOffset: 0,
        inertialBetaOffset: 0,
        inertialRadiusOffset: 0,
        inertialPanningX: 0,
        inertialPanningY: 0,
      });
      camera.upVector = Vector3.Up();
      camera.setTarget(center.clone());
      camera.alpha = view === "question" || loader.isolatedCount > 1 ? Math.PI / 2 : Math.PI / 2.9;
      camera.beta = loader.isolatedCount > 1
        ? 0.01
        : exercise.value?.isolatedBones ? Math.PI / 4 : Math.PI / 1.8;
      frameModel();
      practiceView(camera, scene, exercise.value);
      frameModel();
      setupExercise();
    },
    load(model) {
      onBoneSelect(null); void loader.load(model, exercise.clear);
    },
    dispose() {
      trackball.dispose();
      loader.dispose();
      exercise.clear();
      window.removeEventListener("resize", resize);
      resizeObserver.disconnect();
      engine.dispose();
    },
  };
}

function applyExerciseMuscleLayer(scene: Scene, exercise: Exercise) {
  applyMuscleLayer(scene.meshes, exercise?.exposeDeepMuscles ?? false, exercise?.muscleTarget);
}

function zoomCamera(camera: ArcRotateCamera, factor: number) {
  camera.inertialRadiusOffset = 0;
  camera.radius = Math.max(camera.lowerRadiusLimit ?? 0,
    Math.min(camera.upperRadiusLimit ?? Infinity, camera.radius * factor));
}

function frameCamera(camera: ArcRotateCamera, engine: Engine, radius: number, halfSize: Vector3) {
  if (!radius) return;
  const vertical = camera.fov / 2;
  const horizontal = Math.atan(Math.tan(vertical) * engine.getAspectRatio(camera));
  // Fit the visible model's bounds in the current view instead of its bounding sphere.
  camera.getViewMatrix(true);
  const towardCamera = camera.position.subtract(camera.target).normalize();
  const right = Vector3.Cross(camera.upVector, towardCamera).normalize();
  const up = Vector3.Cross(towardCamera, right).normalize();
  let distance = 0;
  for (const x of [-halfSize.x, halfSize.x]) {
    for (const y of [-halfSize.y, halfSize.y]) {
      for (const z of [-halfSize.z, halfSize.z]) {
        const corner = new Vector3(x, y, z);
        const depth = Vector3.Dot(corner, towardCamera);
        distance = Math.max(distance,
          Math.abs(Vector3.Dot(corner, right)) / Math.tan(horizontal) + depth,
          Math.abs(Vector3.Dot(corner, up)) / Math.tan(vertical) + depth);
      }
    }
  }
  camera.radius = Math.max(camera.lowerRadiusLimit ?? 0, distance * CAMERA_FRAME_PADDING);
}
