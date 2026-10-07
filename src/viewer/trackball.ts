import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Exercise } from "./types";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";

export function attachTrackball(canvas: HTMLCanvasElement, camera: ArcRotateCamera) {
  // O Babylon continua cuidando da pinça, pan e rolagem; só substituímos a rotação.
  const sensitivityX = camera.angularSensibilityX;
  const sensitivityY = camera.angularSensibilityY;
  let enabled = false;
  const pointers = new Map<number, Vector3>();
  const point = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return trackballPoint(event.clientX - rect.left, event.clientY - rect.top,
      rect.width, rect.height);
  };
  const down = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointers.set(event.pointerId, point(event));
  };
  const move = (event: PointerEvent) => {
    const previous = pointers.get(event.pointerId);
    if (!previous || !enabled) return;
    const current = point(event);
    pointers.set(event.pointerId, current);
    if (pointers.size !== 1 || event.ctrlKey || event.shiftKey || event.altKey) return;
    rotateTrackball(camera, previous, current);
  };
  const up = (event: PointerEvent) => { pointers.delete(event.pointerId); };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("lostpointercapture", up);
  const dispose = () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
    canvas.removeEventListener("lostpointercapture", up);
    pointers.clear();
  };
  return {
    dispose,
    setExercise(exercise: Exercise) {
      const next = usesTrackball(exercise);
      if (next === enabled) return;
      enabled = next;
      pointers.clear();
      camera.angularSensibilityX = enabled ? Infinity : sensitivityX;
      camera.angularSensibilityY = enabled ? Infinity : sensitivityY;
      camera.upVector = Vector3.Up();
      camera.rebuildAnglesAndRadius();
    },
  };
}

export function usesTrackball(exercise: Exercise) {
  const target = exercise?.clayTarget;
  if (!target || !exercise?.isolatedBones?.includes(target)) return false;
  return ["humerus", "ulna", "radius", "Fibula"].includes(target);
}

export function trackballPoint(x: number, y: number, width: number, height: number) {
  const scale = Math.max(1, Math.min(width, height)) / 2;
  const point = new Vector3((x - width / 2) / scale, (height / 2 - y) / scale, 0);
  const distance = point.x ** 2 + point.y ** 2;
  point.z = Math.sqrt(Math.max(0, 1 - distance));
  return point.normalize();
}

export function rotateTrackball(camera: ArcRotateCamera, previous: Vector3, current: Vector3) {
  const axis = Vector3.Cross(previous, current);
  if (axis.lengthSquared() < 1e-10) return;
  camera.getViewMatrix(true);
  const offset = camera.position.subtract(camera.target);
  const toward = offset.normalizeToNew();
  const right = Vector3.Cross(camera.upVector, toward).normalize();
  const up = Vector3.Cross(toward, right).normalize();
  const worldAxis = right.scale(axis.x).add(up.scale(axis.y)).add(toward.scale(axis.z)).normalize();
  const angle = Math.acos(Math.max(-1, Math.min(1, Vector3.Dot(previous, current))));
  const rotation = Quaternion.RotationAxis(worldAxis, angle);
  const nextOffset = Vector3.Zero();
  const nextUp = Vector3.Zero();
  offset.rotateByQuaternionToRef(rotation, nextOffset);
  camera.upVector.rotateByQuaternionToRef(rotation, nextUp);
  camera.upVector = nextUp.normalize();
  camera.setPosition(camera.target.add(nextOffset));
}
