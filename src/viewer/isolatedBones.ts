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

  return (keys: string[], preserveLayout = false) => {
    const groups = keys.map((key) => selectPiece(geometry, key));
    const visible = new Set(groups.flat());
    for (const mesh of geometry) {
      mesh.position.copyFrom(originals.get(mesh.uniqueId)!);
      mesh.setEnabled(visible.has(mesh));
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
    if (preserveLayout) {
      centerConnectedPieces(groups, boxes);
      return;
    }
    const spacing = Math.max(...boxes.map((box) => box.size.length())) * 1.3;
    const columns = Math.min(keys.length > 4 ? 3 : 2, keys.length);
    const rows = Math.ceil(keys.length / columns);
    groups.forEach((group, index) => {
      const target = new Vector3(
        (index % columns - (columns - 1) / 2) * spacing,
        0,
        (Math.floor(index / columns) - (rows - 1) / 2) * spacing,
      );
      const offset = target.subtract(boxes[index].center);
      for (const mesh of group) {
        mesh.position.addInPlace(offset);
        mesh.computeWorldMatrix(true);
      }
    });
  };
}

function selectPiece(geometry: AbstractMesh[], key: string) {
  const matches = geometry.filter((mesh) =>
    materialKey(mesh.material?.name ?? "").replace(/[._][lr]$/, "") === key,
  );
  const right = matches.filter((mesh) =>
    /[._]r$/.test(materialKey(mesh.material?.name ?? "")) || /right|[._]r$/.test(mesh.name),
  );
  return right.length ? right : matches;
}

function centerConnectedPieces(
  groups: AbstractMesh[][], boxes: { center: Vector3; size: Vector3 }[],
) {
  let min = new Vector3(Infinity, Infinity, Infinity);
  let max = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const box of boxes) {
    min = Vector3.Minimize(min, box.center.subtract(box.size.scale(0.5)));
    max = Vector3.Maximize(max, box.center.add(box.size.scale(0.5)));
  }
  const offset = min.add(max).scale(-0.5);
  for (const mesh of groups.flat()) {
    mesh.position.addInPlace(offset);
    mesh.computeWorldMatrix(true);
  }
}
