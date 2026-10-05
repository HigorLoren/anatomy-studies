import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import { boneSelection, materialKey } from "./bones";
import type { BoneSelection, Exercise } from "./types";

type ColorProfile = {
  albedoColor: Color3;
  metallic: number;
  roughness: number;
};
type Selected = { original: PBRMaterial; colored: PBRMaterial };

export function createExercise(
  scene: Scene,
  onBoneSelect: (bone: BoneSelection | null) => void,
) {
  const selected = new Map<number, Selected>();
  let value: Exercise = null;

  const clear = () => {
    for (const mesh of scene.meshes) {
      const item = selected.get(mesh.uniqueId);
      if (item) mesh.material = item.original;
    }
    for (const { colored } of selected.values()) colored.dispose();
    selected.clear();
  };

  const choose = (
    mesh: AbstractMesh,
    palette: Map<string, ColorProfile>,
    onNumberSelect: (number: number) => void,
  ) => {
    if (!(mesh.material instanceof PBRMaterial)) return;

    if (value) {
      const index =
        value.markers?.indexOf(
          materialKey(mesh.material.name).replace(/[._][lr]$/, ""),
        ) ?? -1;

      if (index >= 0) onNumberSelect(index + 1);

      return;
    }

    const item = selected.get(mesh.uniqueId);

    if (item) {
      mesh.material = item.original;
      item.colored.dispose();
      selected.delete(mesh.uniqueId);
      onBoneSelect(null);
      return;
    }

    const color = palette.get(materialKey(mesh.material.name));

    if (!color) return;

    const original = mesh.material;
    const colored = new PBRMaterial(`colored-${mesh.name}`, scene);

    Object.assign(colored, color);
    mesh.material = colored;
    selected.set(mesh.uniqueId, { original, colored });

    onBoneSelect(boneSelection(original.name, mesh.name));
  };

  const set = (next: Exercise, configureMarkers: () => void) => {
    clear();
    value = next;
    onBoneSelect(null);
    configureMarkers();
    highlight(scene, value);
  };

  return {
    choose,
    clear,
    get value() {
      return value;
    },
    set,
    highlight: () => highlight(scene, value),
  };
}

function highlight(scene: Scene, exercise: Exercise) {
  const colors = {
    blue: new Color3(0.03, 0.25, 0.6),
    red: new Color3(0.65, 0.03, 0.04),
    green: new Color3(0.02, 0.4, 0.16),
  };

  for (const mesh of scene.meshes) {
    if (!(mesh.material instanceof PBRMaterial)) continue;

    const name = materialKey(mesh.material.name).replace(/[._][lr]$/, "");

    mesh.material.emissiveColor =
      exercise?.correctHighlight === name
        ? colors.green
        : exercise?.highlight === name
          ? colors[exercise.highlightColor ?? "blue"]
          : Color3.Black();
  }
}
