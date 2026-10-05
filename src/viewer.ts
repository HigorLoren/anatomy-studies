import "@babylonjs/loaders/glTF";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { createExercise } from "./viewer/exercise";
import { createMarkers } from "./viewer/markers";
import { createModelLoader } from "./viewer/model";
import type {
  BoneSelection,
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
const CAMERA_FRAME_PADDING = 0.9;

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
    Math.PI / 2.9,
    Math.PI / 1.8,
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

  const lowerFill = new DirectionalLight(
    "lowerFill",
    new Vector3(0.8, 1, 0.5),
    scene,
  );
  lowerFill.intensity = 0.28;

  let center = Vector3.Zero();
  let radius = 0;
  let natural = false;

  const frameModel = () => {
    if (!radius) return;

    const vertical = camera.fov / 2;
    const horizontal = Math.atan(
      Math.tan(vertical) * engine.getAspectRatio(camera),
    );

    camera.radius =
      (radius / Math.sin(Math.min(vertical, horizontal))) *
      CAMERA_FRAME_PADDING;
  };
  const markers = createMarkers({ canvas, camera, engine, scene, onMarkers });
  const exercise = createExercise(scene, onBoneSelect);

  const setupExercise = () => {
    markers.configure(exercise.value, radius);
    exercise.highlight();
  };

  const loader = createModelLoader({
    camera,
    fillLight,
    frameModel,
    keyLight,
    scene,
    setModel: (nextCenter, nextRadius) => {
      center = nextCenter;
      radius = nextRadius;
      camera.setTarget(center.clone());
    },
    setNatural: (value) => {
      natural = value;
    },
    setStatus,
    setupExercise,
  });

  const resize = () => {
    engine.resize();
    frameModel();
  };

  window.addEventListener("resize", resize);

  engine.runRenderLoop(() => {
    scene.render();
    markers.render(exercise.value, radius);
  });

  scene.onPointerObservable.add(({ type, pickInfo }) => {
    if (
      type === PointerEventTypes.POINTERTAP &&
      natural &&
      pickInfo?.hit &&
      pickInfo.pickedMesh
    )
      exercise.choose(pickInfo.pickedMesh, loader.palette, onNumberSelect);
  });

  return {
    exercise(value) {
      exercise.set(value, setupExercise);
    },
    reset(view = "default") {
      Object.assign(camera, {
        inertialAlphaOffset: 0,
        inertialBetaOffset: 0,
        inertialRadiusOffset: 0,
        inertialPanningX: 0,
        inertialPanningY: 0,
      });
      camera.setTarget(center.clone());
      camera.alpha = view === "question" ? Math.PI / 2 : Math.PI / 2.9;
      camera.beta = Math.PI / 1.8;
      frameModel();
    },
    load(model) {
      onBoneSelect(null);
      void loader.load(model, exercise.clear, exercise.value);
    },
    dispose() {
      loader.dispose();
      exercise.clear();
      window.removeEventListener("resize", resize);
      engine.dispose();
    },
  };
}
