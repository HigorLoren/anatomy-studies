import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { ModelId } from "../models";
import { materialKey } from "./bones";

export function createPaintMaterials(scene: Scene) {
  const loads = new Map<string, Promise<Map<string, PBRMaterial>>>();
  const containers: Awaited<ReturnType<typeof LoadAssetContainerAsync>>[] = [];
  let disposed = false;
  return {
    async load(model: ModelId) {
      if (!model.includes("skull")) return new Map<string, PBRMaterial>();
      const file = model === "overview-skull-natural" ? "overview-colored-skull" : "overview-skull-natural";
      let promise = loads.get(file);
      if (!promise) {
        promise = LoadAssetContainerAsync(`${import.meta.env.BASE_URL}${file}.glb`, scene)
          .then((container) => {
            if (disposed) { container.dispose(); return new Map<string, PBRMaterial>(); }
            containers.push(container);
            const materials = new Map<string, PBRMaterial>();
            for (const material of container.materials) {
              if (material instanceof PBRMaterial) {
                materials.set(materialKey(material.name), material);
              }
            }
            return materials;
          });
        loads.set(file, promise);
      }
      return promise;
    },
    dispose() {
      disposed = true;
      for (const container of containers) container.dispose();
      loads.clear();
    },
  };
}
