import { Ray } from "@babylonjs/core/Culling/ray";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Scene } from "@babylonjs/core/scene";
import { materialKey } from "./bones";

type Pin = { mesh: AbstractMesh; localPoint: Vector3; localNormal: Vector3; sizeScale: number };

export function createMusclePins(scene: Scene, camera: ArcRotateCamera) {
  const pins = new Map<string, Pin>();
  return {
    configure(keys: string[], radius = 1) {
      for (const key of keys) {
        const previous = pins.get(key);
        if (previous && !previous.mesh.isDisposed()) continue;
        const meshes = scene.meshes.filter((mesh) => mesh.getTotalVertices() > 0 &&
          materialKey(mesh.material?.name ?? "").replace(/[._][lr]$/, "") === key);
        const pin = surfacePin(scene, camera, meshes, radius);
        if (pin) pins.set(key, pin);
      }
    },
    surface(key: string) {
      return pinSurface(pins.get(key));
    },
    point(key: string) {
      return pinSurface(pins.get(key))?.point;
    },
  };
}

function surfacePin(
  scene: Scene, camera: ArcRotateCamera, meshes: AbstractMesh[], radius: number,
): Pin | undefined {
  camera.getViewMatrix(true);
  let best: Pin | undefined;
  let bestScore = -1;
  for (const mesh of meshes) {
    if (!mesh.isEnabled()) continue;
    mesh.computeWorldMatrix(true);
    const box = mesh.getBoundingInfo().boundingBox;
    const size = box.maximumWorld.subtract(box.minimumWorld);
    const reach = Math.max(size.length(), camera.radius) * 2;
    const towardCamera = camera.position.subtract(box.centerWorld).normalize();
    for (const direction of surfaceDirections(towardCamera)) {
      for (const [x, y] of [[0, 0], [-0.2, 0], [0.2, 0], [0, -0.2], [0, 0.2]]) {
        const center = box.centerWorld.add(new Vector3(size.x * x, size.y * y, 0));
        const origin = center.add(direction.scale(reach));
        const hit = scene.pickWithRay(new Ray(origin, direction.negate()), studyGeometry);
        if (hit?.pickedMesh !== mesh || !hit.pickedPoint) continue;
        const normal = hit.getNormal(true, false) ?? direction;
        if (Vector3.Dot(normal, direction) < 0) normal.negateInPlace();
        const { score: clearance, sizeScale } = plateFit(
          scene, mesh, hit.pickedPoint, normal, radius,
        );
        const score = clearance + sizeScale * 0.3
          + Vector3.Dot(normal, direction) * 0.1 + Number(direction === towardCamera) * 0.2;
        if (score <= bestScore) continue;
        bestScore = score;
        best = localPin(mesh, hit.pickedPoint, normal, sizeScale);
      }
    }
  }
  return best;
}

function surfaceDirections(towardCamera: Vector3) {
  return [towardCamera, Vector3.Forward(), Vector3.Backward(), Vector3.Right(),
    Vector3.Left(), Vector3.Up(), Vector3.Down(),
    ...[1, -1].flatMap(x => [1, -1].map(z => new Vector3(x, 0.6, z).normalize()))];
}

function studyGeometry(mesh: AbstractMesh) {
  return mesh.isEnabled() && mesh.getTotalVertices() > 0 && !mesh.metadata?.practiceMarker;
}

function plateFit(
  scene: Scene, mesh: AbstractMesh, point: Vector3, normal: Vector3, radius: number,
) {
  let best = { score: -1, sizeScale: 1 };
  for (const sizeScale of [1, 0.75, 0.5, 0.4]) {
    const score = surfaceClearance(scene, mesh, point, normal, radius * sizeScale);
    if (score > best.score) best = { score, sizeScale };
    if (score === 8) break;
  }
  return best;
}

function surfaceClearance(
  scene: Scene, mesh: AbstractMesh, point: Vector3, normal: Vector3, radius: number,
) {
  const up = Math.abs(normal.y) > 0.95 ? Vector3.Forward() : Vector3.Up();
  const right = Vector3.Cross(up, normal).normalize();
  const tangentUp = Vector3.Cross(normal, right).normalize();
  let score = 0;
  for (let index = 0; index < 8; index++) {
    const angle = index * Math.PI / 4;
    const rim = point.add(right.scale(Math.cos(angle) * radius * 0.04))
      .add(tangentUp.scale(Math.sin(angle) * radius * 0.04));
    const origin = rim.add(normal.scale(radius * 2));
    const hit = scene.pickWithRay(new Ray(origin, normal.negate()), studyGeometry);
    if (hit?.pickedMesh === mesh && hit.pickedPoint
      && Vector3.Dot(hit.pickedPoint.subtract(rim), normal) < radius * 0.015) score++;
  }
  return score;
}

function localPin(
  mesh: AbstractMesh, point: Vector3, normal: Vector3, sizeScale: number,
): Pin {
  const inverse = Matrix.Invert(mesh.computeWorldMatrix(true));
  return { mesh, sizeScale, localPoint: Vector3.TransformCoordinates(point, inverse),
    localNormal: Vector3.TransformNormal(normal,
      Matrix.Transpose(mesh.getWorldMatrix())).normalize() };
}

function pinSurface(pin?: Pin) {
  if (!pin || pin.mesh.isDisposed() || !pin.mesh.isEnabled()) return undefined;
  const world = pin.mesh.computeWorldMatrix(true);
  return { sizeScale: pin.sizeScale, point: Vector3.TransformCoordinates(pin.localPoint, world),
    normal: Vector3.TransformNormal(pin.localNormal,
      Matrix.Transpose(Matrix.Invert(world))).normalize() };
}
