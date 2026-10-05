import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import { materialKey } from "./bones";

export function createVertebraAppearance(scene: Scene) {
  let container: Awaited<ReturnType<typeof LoadAssetContainerAsync>> | undefined;
  let loading: Promise<void> | undefined;
  let disposed = false;
  return {
    load() {
      return loading ??= LoadAssetContainerAsync(`${import.meta.env.BASE_URL}vertebrae.glb`, scene)
        .then((loaded) => {
          if (disposed) { loaded.dispose(); return; }
          container = loaded;
        });
    },
    apply(meshes: AbstractMesh[], enabled: boolean) {
      if (!enabled) return;
      const source = container?.materials.find((material) => material instanceof PBRMaterial);
      if (!(source instanceof PBRMaterial) || !source.albedoTexture) return;
      for (const mesh of meshes) {
        if (mesh.isDisposed() || !(mesh.material instanceof PBRMaterial)) continue;
        if (materialKey(mesh.material.name) === "Articular cartilage") continue;
        mesh.material.albedoTexture = source.albedoTexture;
        mesh.material.albedoColor = source.albedoColor.clone();
        mesh.material.metallic = source.metallic;
        mesh.material.roughness = source.roughness;
      }
    },
    dispose() { disposed = true; container?.dispose(); },
  };
}
