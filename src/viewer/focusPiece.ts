import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Scene } from "@babylonjs/core/scene";
import { materialKey } from "./bones";
import type { Exercise } from "./types";

export function focusPiece(scene: Scene, camera: ArcRotateCamera, exercise: Exercise) {
  if (!exercise?.highlight || (exercise.isolatedBones?.length ?? 0) < 2) return;
  const meshes = scene.meshes.filter((mesh) =>
    mesh.isEnabled() && mesh.getTotalVertices() > 0 &&
    materialKey(mesh.material?.name ?? "").replace(/[._][lr]$/, "") === exercise.highlight,
  );
  if (!meshes.length) return;

  let min = new Vector3(Infinity, Infinity, Infinity);
  let max = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const mesh of meshes) {
    mesh.computeWorldMatrix(true);
    const box = mesh.getBoundingInfo().boundingBox;
    min = Vector3.Minimize(min, box.minimumWorld);
    max = Vector3.Maximize(max, box.maximumWorld);
  }
  camera.inertialPanningX = 0;
  camera.inertialPanningY = 0;
  camera.setTarget(min.add(max).scale(0.5), false, false, true);
}
