import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Scene } from "@babylonjs/core/scene";
import type { Exercise } from "./types";
import { materialKey } from "./bones";

export function practiceView(camera: ArcRotateCamera, scene: Scene, exercise: Exercise) {
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

function isLateralSkullTarget(target?: string) {
  return target === "Temporal bone" || target === "Zygomatic bone" || target === "Nasal bone";
}
