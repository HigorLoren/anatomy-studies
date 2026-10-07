import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { createMusclePins } from "./musclePins";

// Planos na superfície: a profundidade e a face posterior são tratadas pelo renderizador 3D.
export function createSurfaceNumbers(scene: Scene, pins: ReturnType<typeof createMusclePins>) {
  let plates: ReturnType<typeof createPlate>[] = [];
  const clear = () => {
    for (const { plane, material, texture } of plates) {
      plane.dispose(); material.dispose(); texture.dispose();
    }
    plates = [];
  };
  return {
    configure(keys: string[], radius: number) {
      clear();
      plates = keys.map((key, index) => createPlate(scene, key, index + 1, radius));
    },
    render() {
      for (const { plane, key, offset } of plates) {
        const surface = pins.surface(key);
        plane.setEnabled(Boolean(surface));
        if (!surface) continue;
        const { point, normal, sizeScale } = surface;
        plane.scaling.setAll(sizeScale);
        plane.position.copyFrom(point.add(normal.scale(offset)));
        plane.rotationQuaternion = surfaceNumberRotation(normal);
      }
    },
  };
}

function createPlate(scene: Scene, key: string, number: number, radius: number) {
  const name = `practice-number-${number}`;
  const texture = new DynamicTexture(name, 256, scene, false);
  texture.hasAlpha = true;
  const context = texture.getContext() as CanvasRenderingContext2D;
  context.clearRect(0, 0, 256, 256);
  context.beginPath();
  context.arc(128, 128, 119, 0, Math.PI * 2);
  context.fillStyle = "#173b4b";
  context.fill();
  context.lineWidth = 10;
  context.strokeStyle = "white";
  context.stroke();
  context.fillStyle = "white";
  context.font = "500 150px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(number), 128, 135);
  texture.update();
  const material = new StandardMaterial(name, scene);
  material.diffuseTexture = texture;
  material.useAlphaFromDiffuseTexture = true;
  material.disableLighting = true;
  material.emissiveColor = Color3.White();
  material.backFaceCulling = true;
  const plane = CreatePlane(name, { size: radius * 0.08 }, scene);
  plane.material = material;
  plane.metadata = { practiceMarker: true, practiceNumber: number };
  return { key, plane, material, texture, offset: radius * 0.015 };
}

export function surfaceNumberRotation(normal: Vector3) {
  const up = Math.abs(Vector3.Dot(normal, Vector3.Up())) > 0.95
    ? Vector3.Forward() : Vector3.Up();
  const tangentUp = up.subtract(normal.scale(Vector3.Dot(up, normal))).normalize();
  return Quaternion.FromLookDirectionLH(normal, tangentUp);
}
