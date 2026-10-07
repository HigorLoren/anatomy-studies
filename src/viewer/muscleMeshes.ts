import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { Node } from "@babylonjs/core/node";
import type { Scene } from "@babylonjs/core/scene";
import type { ModelId } from "../models";
import { MUSCLES, MUSCLE_DISTRACTORS, muscleExposure } from "../muscles";
import { materialKey } from "./bones";

// Os músculos compartilham materiais de textura; o nome anatômico está no nó GLB.
export function prepareMuscleMeshes(model: ModelId, meshes: Scene["meshes"]) {
  const muscles = [...MUSCLES, ...MUSCLE_DISTRACTORS].filter((item) => item.model === model);
  const materials = new Map<string, PBRMaterial>();
  for (const mesh of meshes) {
    if (!mesh.getTotalVertices()) continue;
    const names: string[] = [];
    for (let node: Node | null = mesh; node; node = node.parent) {
      names.push(materialKey(node.name).replace(/[._][lr]$/, ""));
    }
    const muscle = muscles.find((item) => item.nodes.some((name) => names.includes(name)));
    if (isStudyObstruction(model, mesh.material?.name ?? "", names)) {
      mesh.dispose();
      continue;
    }
    mesh.metadata = {
      ...mesh.metadata,
      muscleTarget: Boolean(muscle),
      anatomyNodes: names,
      muscleLayerCover: names.some((name) => SUPERFICIAL_COVERS.includes(name)),
    };
    if (!muscle || !(mesh.material instanceof PBRMaterial)) continue;
    const key = `${muscle.key}:${mesh.material.uniqueId}`;
    let material = materials.get(key);
    if (!material) {
      material = mesh.material.clone(muscle.key);
      materials.set(key, material);
    }
    mesh.material = material;
  }
}

const SUPERFICIAL_COVERS = [
  "Deltoid muscle", "Trapezius muscle", "Pectoralis major", "Latissimus dorsi",
  "Rectus femoris", "Lateral head of gastrocnemius", "Medial head of gastrocnemius",
];

export function isStudyObstruction(model: ModelId, material: string, names: string[]) {
  const key = materialKey(material).replace(/[._][lr]$/, "");
  if (key === "sacrum") return true;
  if (model === "upper-muscles-practice" && names.some(name =>
    /^(clavicle)$|(?:articular cartilage|art cart).*clavicle/i.test(name),
  )) return true;
  if (isAxialStructure(names)) return true;
  if (/^(Disc|Bursae)$/.test(key)) return true;
  if (/fascia|overlay|sheath|retinaculum|artery|vein|nerves|fat/i.test(material)) return true;
  if (/^(Atlas|Axis|Vertebra_[CTL]\d+|[CTL]\d+)$/.test(key)) return true;
  return model === "upper-muscles-practice" &&
    ["sternum", "Body of sternum", "Xiphoid process", "clavicle", "Coccyx"].includes(key);
}

function isAxialStructure(names: string[]) {
  // Cartilagens do membro compartilham o material das cartilagens axiais.
  const ribsAndDiscs = /\brib\b|costal cart|sternocostal|annulus fibrosus|nucleus pulposus/i;
  const vertebralCart = /^Vertebra [CTL]\d+ art cart|art cart of (Atlas|Axis)/i;
  const centralJoints =
    /sacrum (art process|lumbosacral joint)|sternoclavicular joint on manubrium/i;
  const sacralCartilage = /(?:art cart|articular cartilage).*on sacrum/i;
  return names.some((name) =>
    ribsAndDiscs.test(name) || vertebralCart.test(name)
      || centralJoints.test(name) || sacralCartilage.test(name),
  );
}

export function applyMuscleLayer(meshes: Scene["meshes"], exposeDeep: boolean, target?: string) {
  const covers = target ? muscleExposure(target) : SUPERFICIAL_COVERS;
  for (const mesh of meshes) {
    const names: string[] | undefined = mesh.metadata?.anatomyNodes;
    if (names) mesh.setEnabled(!(exposeDeep && names.some((name) => covers.includes(name))));
  }
}
