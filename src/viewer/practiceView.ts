import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Scene } from "@babylonjs/core/scene";
import type { Exercise } from "./types";
import { materialKey } from "./bones";
import { visibleSurfaceAnchor } from "./surfaceAnchor";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export function practiceView(camera: ArcRotateCamera, scene: Scene, exercise: Exercise) {
  muscleView(camera, scene, exercise);
  if (exercise?.isolatedBones?.length === 1) {
    camera.beta = Math.PI / 2;
  }
  if (!isLateralSkullTarget(exercise?.clayTarget)) return;
  const mesh = scene.meshes.find((item) => item.isEnabled() &&
    materialKey(item.material?.name ?? "").replace(/[._][lr]$/, "") === exercise?.clayTarget);
  if (!mesh) return;
  mesh.computeWorldMatrix(true);
  const side = mesh.getBoundingInfo().boundingBox.centerWorld.x - camera.target.x;
  camera.alpha = side < 0 ? Math.PI * 0.8 : Math.PI * 0.2;
  camera.beta = Math.PI / 2;
}

function muscleView(camera: ArcRotateCamera, scene: Scene, exercise: Exercise) {
  if (exercise?.exposeDeepMuscles !== undefined && !exercise.clayTarget) {
    camera.alpha = Math.PI / 2;
    camera.beta = Math.PI / 2;
  }
  faceMarkedMuscle(camera, scene, exercise?.muscleTarget ?? exercise?.clayTarget);
}

function faceMarkedMuscle(camera: ArcRotateCamera, scene: Scene, target?: string) {
  const muscles = scene.meshes.filter((mesh) => mesh.metadata?.muscleTarget && mesh.isEnabled()
    && materialKey(mesh.material?.name ?? "") === target);
  if (!muscles.length) return;
  camera.beta = Math.PI / 2;
  const window = muscles.find(mesh => mesh.metadata?.soleusWindow)?.metadata.soleusWindow;
  if (window) {
    camera.alpha = Math.atan2(window.posterior.z, window.posterior.x);
    return;
  }
  let bestAlpha = camera.alpha;
  let bestScore = -1;
  for (let index = 0; index < 8; index++) {
    const alpha = index * Math.PI / 4;
    camera.alpha = alpha;
    camera.getViewMatrix(true);
    const score = muscles.reduce(
      (total, mesh) => total + visibleMuscleScore(scene, camera, mesh), 0,
    );
    if (score > bestScore) { bestScore = score; bestAlpha = alpha; }
  }
  camera.alpha = bestAlpha;
}

function visibleMuscleScore(scene: Scene, camera: ArcRotateCamera, mesh: Scene["meshes"][number]) {
  const box = mesh.getBoundingInfo().boundingBox;
  const size = box.maximumWorld.subtract(box.minimumWorld);
  let score = 0;
  for (const x of [-0.3, 0, 0.3]) {
    for (const y of [-0.3, 0, 0.3]) {
      const point = box.centerWorld.add(new Vector3(size.x * x, size.y * y, 0));
      const ray = new Ray(camera.position, point.subtract(camera.position).normalize());
      const hit = scene.pickWithRay(ray, (item) => item.isEnabled() && item.getTotalVertices() > 0);
      if (hit?.pickedMesh === mesh) score++;
    }
  }
  return score || Number(Boolean(visibleSurfaceAnchor(scene, mesh, camera)));
}

function isLateralSkullTarget(target?: string) {
  return target === "Temporal bone" || target === "Zygomatic bone" || target === "Nasal bone";
}
