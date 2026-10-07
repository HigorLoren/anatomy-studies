import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

export function createClayMarker(scene: Scene, anchor: Vector3, radius: number, normal: Vector3) {
  const material = new StandardMaterial("practice-blue-clay", scene);
  material.diffuseColor = new Color3(0.02, 0.24, 0.95);
  material.emissiveColor = new Color3(0.01, 0.03, 0.12);
  material.specularColor = new Color3(0.08, 0.08, 0.1);
  const clay = CreateSphere("practice-blue-clay", {
    diameter: radius * 0.09, segments: 12,
  }, scene);
  clay.position.copyFrom(anchor.add(normal.scale(radius * 0.015)));
  clay.scaling.set(1.15, 0.85, 0.8);
  clay.material = material;
  clay.isPickable = false;
  clay.metadata = { practiceMarker: true };
  return () => { clay.dispose(); material.dispose(); };
}
