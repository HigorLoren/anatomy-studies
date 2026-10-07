import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Node } from "@babylonjs/core/node";
import type { Scene } from "@babylonjs/core/scene";

export function mirrorRightGroups(
  groups: TransformNode[], nodes: Node[], meshes: Scene["meshes"],
) {
  for (const group of groups.filter((node) => node.name.endsWith("_right"))) {
    const left = group.clone(
      group.name.replace(/_right$/, "_left"),
      group.parent,
    );

    if (!left) continue;

    const mirrored = left as TransformNode;

    mirrored.scaling.x *= -1;
    nodes.push(mirrored);

    for (const mesh of mirrored.getChildMeshes()) {
      meshes.push(mesh);
      mesh.name = mesh.name.replace(`${group.name}.`, "").replace(/\.r$/, ".l");
    }
  }
  return nodes;
}
