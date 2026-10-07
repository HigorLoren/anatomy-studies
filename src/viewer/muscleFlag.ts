import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, type Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { surfaceNumberRotation } from "./surfaceNumbers";

export function createMuscleFlag(
  scene: Scene, anchor: Vector3, radius: number, normal: Vector3, muscleSize: number,
) {
  const size = Math.min(radius * 0.055, muscleSize * 0.14);
  const root = new TransformNode("practice-muscle-flag", scene);
  root.position.copyFrom(anchor);
  root.rotationQuaternion = surfaceNumberRotation(normal)
    .multiply(Quaternion.FromEulerAngles(Math.PI / 5, 0, 0));
  const poleMaterial = new StandardMaterial("practice-flag-pole", scene);
  poleMaterial.diffuseColor = Color3.White();
  const pole = CreateCylinder("practice-flag-pole", {
    height: size, diameter: size * 0.035, tessellation: 8,
  }, scene);
  pole.parent = root;
  pole.rotation.x = -Math.PI / 2;
  pole.position.z = -size / 2;
  pole.material = poleMaterial;
  const flagMaterial = new StandardMaterial("practice-flag-blue", scene);
  flagMaterial.diffuseColor = new Color3(0.02, 0.24, 0.95);
  flagMaterial.emissiveColor = new Color3(0.01, 0.03, 0.12);
  flagMaterial.backFaceCulling = false;
  const flag = new Mesh("practice-flag-blue", scene);
  const vertices = new VertexData();
  // The pennant's attachment edge runs along the shaft, near its tip.
  const outer = [0, 0, -size, size * 0.8, 0, -size * 0.775,
    0, 0, -size * 0.55];
  const inner = [size * 0.025, 0, -size * 0.966,
    size * 0.7, 0, -size * 0.775, size * 0.025, 0, -size * 0.584];
  vertices.positions = inner;
  vertices.indices = [0, 2, 1];
  vertices.normals = [0, 1, 0, 0, 1, 0, 0, 1, 0];
  vertices.applyToMesh(flag);
  flag.parent = root;
  flag.material = flagMaterial;
  const borderMaterial = new StandardMaterial("practice-flag-border", scene);
  borderMaterial.emissiveColor = new Color3(0.65, 0.65, 0.65);
  borderMaterial.backFaceCulling = false;
  const border = new Mesh("practice-flag-border", scene);
  const borderVertices = new VertexData();
  borderVertices.positions = [...outer, ...inner];
  borderVertices.indices = [0, 3, 1, 1, 3, 4, 1, 4, 2, 2, 4, 5, 2, 5, 0, 0, 5, 3];
  borderVertices.normals = Array.from({ length: 6 }, () => [0, 1, 0]).flat();
  borderVertices.applyToMesh(border);
  border.parent = root;
  border.material = borderMaterial;
  for (const mesh of [pole, flag, border]) {
    mesh.isPickable = false;
    mesh.metadata = { practiceMarker: true };
  }
  return () => {
    root.dispose(); poleMaterial.dispose(); flagMaterial.dispose(); borderMaterial.dispose();
  };
}
