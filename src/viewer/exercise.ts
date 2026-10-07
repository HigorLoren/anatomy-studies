import "@babylonjs/core/Rendering/outlineRenderer";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import { boneSelection, materialKey } from "./bones";
import { MUSCLES, MUSCLE_DISTRACTORS } from "../muscles";
import type { BoneSelection, Exercise } from "./types";

export function createExercise(
  scene: Scene,
  onBoneSelect: (bone: BoneSelection | null) => void,
) {
  const painted = new Map<AbstractMesh, { original: PBRMaterial; replacement: PBRMaterial }>();
  let selectedMesh: AbstractMesh | undefined;
  let painting = false;
  let value: Exercise = null;

  const clearSelection = () => {
    if (selectedMesh) selectedMesh.renderOutline = false;
    selectedMesh = undefined;
    onBoneSelect(null);
  };
  const clear = () => {
    clearSelection();
    for (const [mesh, item] of painted) {
      if (!mesh.isDisposed()) mesh.material = item.original;
      item.replacement.dispose();
    }
    painted.clear();
    for (const mesh of scene.meshes) mesh.renderOutline = false;
  };
  const choose = (
    mesh: AbstractMesh,
    materials: Map<string, PBRMaterial>,
    onNumberSelect: (number: number) => void,
  ) => {
    if (mesh.metadata?.practiceNumber) {
      onNumberSelect(mesh.metadata.practiceNumber);
      return;
    }
    if (!(mesh.material instanceof PBRMaterial)) return;
    if (value && !value.exploring) {
      const key = materialKey(mesh.material.name).replace(/[._][lr]$/, "");
      const index = value.markers?.indexOf(key) ?? -1;
      if (index >= 0) onNumberSelect(index + 1);
      return;
    }
    const wasSelected = selectedMesh === mesh;
    clearSelection();
    if (painting) togglePaint(mesh, materials, painted);
    if (wasSelected && !painting) return;
    selectedMesh = mesh;
    outline(mesh, new Color3(0.03, 0.25, 0.6));
    onBoneSelect(structureSelection(mesh));
  };
  return {
    choose, clear,
    paint(enabled: boolean) { painting = enabled; clearSelection(); },
    get value() { return value; },
    set(next: Exercise, configureMarkers: () => void) {
      clear();
      value = next;
      configureMarkers();
      highlight(scene, value);
    },
    highlight: () => highlight(scene, value),
  };
}

function structureSelection(mesh: AbstractMesh) {
  const material = mesh.material!.name;
  const selection = boneSelection(material, mesh.name);
  const muscle = [...MUSCLES, ...MUSCLE_DISTRACTORS].find(
    item => item.key === materialKey(material),
  );
  return muscle ? { ...selection, name: `Músculo ${muscle.name}` } : selection;
}

function togglePaint(
  mesh: AbstractMesh,
  materials: Map<string, PBRMaterial>,
  painted: Map<AbstractMesh, { original: PBRMaterial; replacement: PBRMaterial }>,
) {
  const existing = painted.get(mesh);
  if (existing) {
    mesh.material = existing.original;
    existing.replacement.dispose();
    painted.delete(mesh);
    return;
  }
  if (!(mesh.material instanceof PBRMaterial)) return;
  const original = mesh.material;
  const template = materials.get(materialKey(original.name));
  const replacement = (template ?? original).clone(original.name);
  if (!template) replacement.emissiveColor = new Color3(0.03, 0.25, 0.6);
  mesh.material = replacement;
  painted.set(mesh, { original, replacement });
}

function highlight(scene: Scene, exercise: Exercise) {
  if (exercise?.isolatedBones?.length === 1) exercise = null;
  for (const mesh of scene.meshes) {
    if (!(mesh.material instanceof PBRMaterial)) continue;

    const name = materialKey(mesh.material.name).replace(/[._][lr]$/, "");

    const color = highlightColor(name, exercise);

    mesh.renderOutline = exercise?.highlight === name || exercise?.correctHighlight === name;
    if (mesh.renderOutline) outline(mesh, color);
  }
}

function outline(mesh: AbstractMesh, color: Color3) {
  mesh.renderOutline = true;
  mesh.outlineColor = new Color3(
    Math.min(color.r * 2, 1), Math.min(color.g * 2, 1), Math.min(color.b * 2, 1),
  );
  const box = mesh.getBoundingInfo().boundingBox;
  mesh.outlineWidth = box.maximum.subtract(box.minimum).length() * 0.008;
}

function highlightColor(name: string, exercise: Exercise) {
  const colors = {
    blue: new Color3(0.03, 0.25, 0.6),
    red: new Color3(0.65, 0.03, 0.04),
    green: new Color3(0.02, 0.4, 0.16),
  };

  return exercise?.correctHighlight === name
    ? colors.green
    : exercise?.highlight === name
      ? colors[exercise.highlightColor ?? "blue"]
      : Color3.Black();
}
