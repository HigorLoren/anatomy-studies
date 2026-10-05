import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { materialKey } from "./bones";

export function createIsolatedBones(meshes: AbstractMesh[]) {
  const geometry = meshes.filter((mesh) => mesh.getTotalVertices() > 0);
  const originals = new Map<number, Vector3>();
  for (const mesh of geometry) {
    mesh.setParent(null);
    originals.set(mesh.uniqueId, mesh.position.clone());
  }

  return (keys: string[]) => {
    const groups = keys.map((key) => geometry.filter((mesh) =>
      materialKey(mesh.material?.name ?? "") === key,
    ));
    for (const mesh of geometry) {
      mesh.position.copyFrom(originals.get(mesh.uniqueId)!);
      mesh.setEnabled(keys.includes(materialKey(mesh.material?.name ?? "")));
      mesh.computeWorldMatrix(true);
    }
    const boxes = groups.map((group) => {
      if (!group.length) throw new Error("A estrutura isolada não existe no modelo.");
      let min = new Vector3(Infinity, Infinity, Infinity);
      let max = new Vector3(-Infinity, -Infinity, -Infinity);
      for (const mesh of group) {
        const box = mesh.getBoundingInfo().boundingBox;
        min = Vector3.Minimize(min, box.minimumWorld);
        max = Vector3.Maximize(max, box.maximumWorld);
      }
      return { center: min.add(max).scale(0.5), size: max.subtract(min) };
    });
    const spacing = Math.max(...boxes.map((box) => box.size.length())) * 1.3;
    const columns = Math.min(keys.length > 4 ? 3 : 2, keys.length);
    const rows = Math.ceil(keys.length / columns);
    groups.forEach((group, index) => {
      const target = new Vector3(
        (index % columns - (columns - 1) / 2) * spacing,
        ((rows - 1) / 2 - Math.floor(index / columns)) * spacing,
        0,
      );
      const offset = target.subtract(boxes[index].center);
      for (const mesh of group) {
        mesh.position.addInPlace(offset);
        mesh.computeWorldMatrix(true);
      }
    });
  };
}
