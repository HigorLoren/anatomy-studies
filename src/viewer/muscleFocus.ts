import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Scene } from "@babylonjs/core/scene";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { materialKey } from "./bones";
import type { Exercise } from "./types";

type Surface = { point: Vector3; normal: Vector3 };
type Pose = { target: Vector3; alpha: number; beta: number; radius: number };
type Transition = { from: Pose; to: Pose; elapsed: number };

export function createMuscleFocus(
  scene: Scene, camera: ArcRotateCamera, surface: (key: string) => Surface | undefined,
) {
  let selected = "";
  let transition: Transition | undefined;
  const cancel = () => { transition = undefined; };
  const configure = (exercise: Exercise) => {
    const key = exercise?.muscleTarget && (exercise.highlight ?? exercise.clayTarget);
    if (!key) { selected = ""; cancel(); return; }
    const meshes = scene.meshes.filter(mesh => mesh.isEnabled() && mesh.getTotalVertices() > 0
      && materialKey(mesh.material?.name ?? "").replace(/[._][lr]$/, "") === key);
    const anchor = surface(key);
    if (!meshes.length || !anchor) return;
    const signature = `${key}:${meshes.map(mesh => mesh.uniqueId).join(",")}`;
    if (signature === selected) return;
    selected = signature;
    const to = muscleFocusPose(meshes, anchor, camera, scene.getEngine().getAspectRatio(camera));
    const from = cameraPose(camera);
    to.alpha = from.alpha + shortestAngle(to.alpha - from.alpha);
    clearCameraMotion(camera);
    if (exercise?.clayTarget) {
      cancel(); applyPose(camera, from, to, 1); return;
    }
    transition = { from, to, elapsed: 0 };
  };
  const update = (milliseconds: number) => {
    if (!transition) return;
    transition.elapsed += milliseconds;
    const progress = Math.min(1, transition.elapsed / 550);
    const blend = progress * progress * (3 - 2 * progress);
    applyPose(camera, transition.from, transition.to, blend);
    if (progress === 1) cancel();
  };
  const beforeRender = scene.onBeforeRenderObservable.add(
    () => update(scene.getEngine().getDeltaTime()),
  );
  const pointer = scene.onPointerObservable.add(({ type }) => {
    if (type === PointerEventTypes.POINTERDOWN || type === PointerEventTypes.POINTERWHEEL) cancel();
  });
  return {
    configure, update, cancel,
    refresh(exercise: Exercise) { selected = ""; configure(exercise); },
    dispose() {
      cancel(); scene.onBeforeRenderObservable.remove(beforeRender);
      scene.onPointerObservable.remove(pointer);
    },
  };
}

export function muscleFocusPose(
  meshes: AbstractMesh[], anchor: Surface, camera: ArcRotateCamera, aspect: number,
): Pose {
  let min = new Vector3(Infinity, Infinity, Infinity);
  let max = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const mesh of meshes) {
    mesh.computeWorldMatrix(true);
    const box = mesh.getBoundingInfo().boundingBox;
    min = Vector3.Minimize(min, box.minimumWorld);
    max = Vector3.Maximize(max, box.maximumWorld);
  }
  const target = min.add(max).scale(0.5);
  const halfFov = Math.min(camera.fov / 2, Math.atan(Math.tan(camera.fov / 2) * aspect));
  const distance = max.subtract(min).length() * 0.65 / Math.sin(halfFov)
    + Vector3.Distance(anchor.point, target);
  const offset = anchor.point.add(anchor.normal.scale(distance)).subtract(target);
  const radius = Math.max(camera.lowerRadiusLimit ?? 0, offset.length());
  return { target, radius, alpha: Math.atan2(offset.z, offset.x),
    beta: Math.max(0.04, Math.min(Math.PI - 0.04, Math.acos(offset.y / offset.length()))) };
}

function cameraPose(camera: ArcRotateCamera): Pose {
  return { target: camera.target.clone(),
    alpha: camera.alpha, beta: camera.beta, radius: camera.radius };
}

function shortestAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function clearCameraMotion(camera: ArcRotateCamera) {
  camera.inertialAlphaOffset = 0; camera.inertialBetaOffset = 0;
  camera.inertialRadiusOffset = 0; camera.inertialPanningX = 0; camera.inertialPanningY = 0;
}

function applyPose(camera: ArcRotateCamera, from: Pose, to: Pose, blend: number) {
  camera.setTarget(Vector3.Lerp(from.target, to.target, blend), false, false, true);
  camera.alpha = from.alpha + (to.alpha - from.alpha) * blend;
  camera.beta = from.beta + (to.beta - from.beta) * blend;
  camera.radius = from.radius + (to.radius - from.radius) * blend;
}
