import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Scene } from "@babylonjs/core/scene";

// Só aceita a primeira superfície visível, evitando pontos dentro de ossos vizinhos.
export function visibleSurfaceAnchor(
  scene: Scene, mesh: AbstractMesh, camera: ArcRotateCamera,
) {
  mesh.computeWorldMatrix(true);
  camera.getViewMatrix(true);
  const box = mesh.getBoundingInfo().boundingBox;
  const size = box.maximumWorld.subtract(box.minimumWorld);
  for (const [x, y, z] of sampleOffsets()) {
    const target = box.centerWorld.add(new Vector3(size.x * x, size.y * y, size.z * z));
    const direction = target.subtract(camera.position).normalize();
    const hit = scene.pickWithRay(new Ray(camera.position, direction),
      (item) => item.isEnabled() && item.getTotalVertices() > 0 && !item.metadata?.practiceMarker);
    if (hit?.pickedMesh === mesh && hit.pickedPoint) {
      const normal = hit.getNormal(true) ?? direction.negate();
      if (Vector3.Dot(normal, direction) > 0) normal.negateInPlace();
      return { point: hit.pickedPoint.clone(), normal };
    }
  }
}

function sampleOffsets() {
  const offsets: number[][] = [[0, 0, 0]];
  for (const y of [0, -0.2, 0.2, -0.4, 0.4]) {
    for (const x of [0, -0.2, 0.2, -0.4, 0.4]) {
      for (const z of [0, -0.3, 0.3]) offsets.push([x, y, z]);
    }
  }
  return offsets;
}
