import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
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
  prepareSoleusWindow(meshes, exposeDeep && target === "Soleus");
  const covers = target ? muscleExposure(target) : SUPERFICIAL_COVERS;
  for (const mesh of meshes) {
    const names: string[] | undefined = mesh.metadata?.anatomyNodes;
    if (names) mesh.setEnabled(!(exposeDeep && names.some((name) => covers.includes(name))));
  }
}

// Retraction is reversible and leaves the proximal and distal attachments in place.
const gastrocnemiusGeometry = new WeakMap<Mesh, {
  positions: number[]; normals: number[]; opened: boolean;
}>();

function prepareSoleusWindow(meshes: Scene["meshes"], opened: boolean) {
  const soleus = meshes.find(mesh => mesh.metadata?.anatomyNodes?.includes("Soleus muscle"));
  const heads = meshes.filter(mesh => mesh instanceof Mesh && mesh.metadata?.anatomyNodes?.some(
    (name: string) => /^(Lateral|Medial) head of gastrocnemius$/.test(name),
  )) as Mesh[];
  if (!soleus || heads.length < 2) return;
  soleus.computeWorldMatrix(true);
  const box = soleus.getBoundingInfo().boundingBox;
  const width = box.maximumWorld.x - box.minimumWorld.x;
  // glTF's posterior (-Z) is transformed by the imported root into scene coordinates.
  const posterior = Vector3.TransformNormal(
    new Vector3(0, 0, -1), soleus.getWorldMatrix(),
  ).normalize();
  soleus.metadata.soleusWindow = opened ? {
    center: box.centerWorld.add(new Vector3(0, (box.maximumWorld.y - box.minimumWorld.y) * 0.2, 0)),
    posterior,
  } : undefined;
  for (const head of heads) retractHead(head, opened, box.centerWorld.x, width);
}

function retractHead(head: Mesh, opened: boolean, centerX: number, width: number) {
  let original = gastrocnemiusGeometry.get(head);
  if (!original) {
    const positions = head.getVerticesData(VertexBuffer.PositionKind);
    const normals = head.getVerticesData(VertexBuffer.NormalKind);
    if (!positions || !normals) return;
    original = { positions: Array.from(positions), normals: Array.from(normals), opened: false };
    gastrocnemiusGeometry.set(head, original);
  }
  if (original.opened === opened) return;
  head.makeGeometryUnique();
  const positions = original.positions.slice();
  const normals = original.normals.slice();
  if (opened) {
    const world = head.computeWorldMatrix(true);
    const inverse = Matrix.Invert(world);
    const bounds = head.getBoundingInfo().boundingBox;
    const height = bounds.maximumWorld.y - bounds.minimumWorld.y;
    const sign = Math.sign(bounds.centerWorld.x - centerX) || 1;
    for (let i = 0; i < positions.length; i += 3) {
      const point = Vector3.TransformCoordinates(Vector3.FromArray(positions, i), world);
      const fraction = Math.max(0, Math.min(1, (point.y - bounds.minimumWorld.y) / height));
      point.x += sign * width * 0.24 * Math.sin(Math.PI * fraction) ** 2;
      Vector3.TransformCoordinates(point, inverse).toArray(positions, i);
    }
    VertexData.ComputeNormals(positions, head.getIndices() ?? [], normals);
  }
  head.setVerticesData(VertexBuffer.PositionKind, positions, true);
  head.setVerticesData(VertexBuffer.NormalKind, normals, true);
  head.refreshBoundingInfo();
  head.computeWorldMatrix(true);
  original.opened = opened;
}
