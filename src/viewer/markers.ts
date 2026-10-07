import { Ray } from "@babylonjs/core/Culling/ray";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Scene } from "@babylonjs/core/scene";
import { visibleSurfaceAnchor } from "./surfaceAnchor";
import { createClayMarker } from "./clayMarker";
import { createMusclePins } from "./musclePins";
import { createSurfaceNumbers } from "./surfaceNumbers";
import { materialKey } from "./bones";
import type { Exercise, Marker } from "./types";

type Options = {
  canvas: HTMLCanvasElement;
  camera: ArcRotateCamera;
  engine: Engine;
  scene: Scene;
  onMarkers: (markers: Marker[]) => void;
};

export function createMarkers({
  canvas,
  camera,
  engine,
  scene,
  onMarkers,
}: Options) {
  const anchors = new Map<string, Vector3>();
  const musclePins = createMusclePins(scene, camera);
  const surfaceNumbers = createSurfaceNumbers(scene, musclePins);
  let signature = "";
  let clearClay: (() => void) | undefined;

  const configure = (exercise: Exercise, modelRadius: number) => {
    clearClay?.();
    clearClay = undefined;
    anchors.clear();
    const numbers = muscleNumberKeys(exercise);
    musclePins.configure(numbers, modelRadius);
    surfaceNumbers.configure(numbers, modelRadius);
    surfaceNumbers.render();

    for (const name of markerTargets(exercise)) {
      const matches = scene.meshes.filter(
        (item) =>
          item.isEnabled() &&
          item.material &&
          materialKey(item.material.name).replace(/[._][lr]$/, "") === name &&
          item.getTotalVertices() > 0,
      );

      // Um músculo pode ter várias cabeças; marque uma superfície visível do conjunto.
      const { mesh, surface } = markerSurface(
        scene, matches, camera, name === exercise?.clayTarget,
      );

      const anchor = mesh && findSurfaceAnchor(scene, mesh, name, modelRadius);

      if (anchor) {
        anchors.set(name, anchor);
        if (name === exercise?.clayTarget) {
          if (surface) {
            clearClay = createClayMarker(scene, surface.point, modelRadius, surface.normal);
          }
        }
      }
    }
  };

  const render = (exercise: Exercise, modelRadius: number) => {
    const viewport = camera.viewport.toGlobal(
      engine.getRenderWidth(),
      engine.getRenderHeight(),
    );

    const size = markerSize(canvas, camera, modelRadius);

    surfaceNumbers.render();
    const keys = exercise?.muscleTarget ? [] : exercise?.markers ?? [];
    const markers = keys.map((name, index) =>
      marker(anchors.get(name),
      index + 1, size, { scene, viewport, engine }),
    );

    const next = JSON.stringify(
      markers.map((item) => ({
        ...item,
        x: Math.round(item.x * 10) / 10,
        y: Math.round(item.y * 10) / 10,
      })),
    );

    if (next !== signature) {
      signature = next;
      onMarkers(markers);
    }
  };

  return { configure, render };
}

function markerSurface(
  scene: Scene, meshes: Scene["meshes"], camera: ArcRotateCamera, clay: boolean,
) {
  if (clay) {
    for (const mesh of meshes) {
      const surface = visibleSurfaceAnchor(scene, mesh, camera);
      if (surface) return { mesh, surface };
    }
  }
  return {
    mesh: meshes.find((item) => /right|\.r$/.test(item.name)) ?? meshes[0],
    surface: undefined,
  };
}

function findSurfaceAnchor(
  scene: Scene,
  mesh: Scene["meshes"][number],
  name: string,
  radius: number,
) {
  const box = mesh.getBoundingInfo().boundingBox;
  const center = box.centerWorld;
  const extent = box.maximumWorld.subtract(box.minimumWorld);
  const y =
    name === "Mandible bone" ? box.minimumWorld.y + extent.y * 0.2 : center.y;

  for (const dy of [0, -0.1, 0.1, -0.2, 0.2, -0.35, 0.35]) {
    for (const dx of [0, -0.1, 0.1, -0.2, 0.2, -0.35, 0.35]) {
      const origin = new Vector3(
        center.x + extent.x * dx,
        y + extent.y * dy,
        box.maximumWorld.z + radius * 2,
      );

      const hit = scene.pickWithRay(
        new Ray(origin, new Vector3(0, 0, -1)),
        (item) => item === mesh,
      );

      if (hit?.pickedPoint) return hit.pickedPoint.clone();
    }
  }
}

function marker(
  anchor: Vector3 | undefined,
  number: number,
  size: number,
  {
    scene,
    viewport,
    engine,
  }: {
    scene: Scene;
    viewport: ReturnType<ArcRotateCamera["viewport"]["toGlobal"]>;
    engine: Engine;
  },
): Marker {
  if (!anchor) return { number, x: 0, y: 0, size, visible: false };

  const point = Vector3.Project(
    anchor,
    Matrix.Identity(),
    scene.getTransformMatrix(),
    viewport,
  );

  return {
    number,
    size,
    x: (point.x / engine.getRenderWidth()) * 100,
    y: (point.y / engine.getRenderHeight()) * 100,
    visible: point.z > 0 && point.z < 1,
  };
}

function markerSize(
  canvas: HTMLCanvasElement,
  camera: ArcRotateCamera,
  radius: number,
) {
  const projected =
    (canvas.clientHeight * radius * 0.09) /
    (2 * camera.radius * Math.tan(camera.fov / 2));
  return Math.round(Math.max(12, Math.min(28, projected)) * 2) / 2;
}

function markerTargets(exercise: Exercise) {
  return exercise?.clayTarget ? [exercise.clayTarget] : exercise?.markers ?? [];
}

function muscleNumberKeys(exercise: Exercise) {
  return exercise?.muscleTarget ? exercise.markers ?? [] : [];
}
