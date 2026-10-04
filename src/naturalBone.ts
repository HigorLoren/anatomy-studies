import { MaterialPluginBase } from "@babylonjs/core/Materials/materialPluginBase";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";

// Object-scale surface detail leaves the mesh and its anatomical normal map intact.
class BoneSurface extends MaterialPluginBase {
  constructor(material: PBRMaterial, radius: number) {
    super(material, "NaturalBoneSurface", 200);
    this.radius = radius;
    this._enable(true);
  }

  private readonly radius: number;

  override getCustomCode(shaderType: string) {
    if (shaderType !== "fragment") return null;
    return {
      CUSTOM_FRAGMENT_DEFINITIONS: `
        float boneHash(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }
        float boneNoise(vec3 p) {
          vec3 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(boneHash(i), boneHash(i+vec3(1,0,0)), f.x),
                         mix(boneHash(i+vec3(0,1,0)), boneHash(i+vec3(1,1,0)), f.x), f.y),
                     mix(mix(boneHash(i+vec3(0,0,1)), boneHash(i+vec3(1,0,1)), f.x),
                         mix(boneHash(i+vec3(0,1,1)), boneHash(i+vec3(1,1,1)), f.x), f.y), f.z);
        }
      `,
      CUSTOM_FRAGMENT_BEFORE_LIGHTS: `
        vec3 boneP = vPositionW / ${Math.max(this.radius, 0.000001).toFixed(8)};
        float boneCloud = boneNoise(boneP * 18.0);
        float boneGrain = boneNoise(boneP * 130.0);
        float bonePores = smoothstep(0.72, 0.9, boneNoise(boneP * 240.0));
        vec3 boneTint = mix(vec3(0.90, 0.84, 0.73), vec3(1.0, 0.97, 0.90), boneCloud);
        surfaceAlbedo *= boneTint * (0.97 + 0.06 * boneGrain);
        surfaceAlbedo *= 1.0 - 0.12 * bonePores;
        float boneHeight = (boneGrain - bonePores * 0.3) * ${Math.max(this.radius * 0.0003, 0.00000001).toFixed(10)};
        vec3 boneDx = dFdx(vPositionW), boneDy = dFdy(vPositionW);
        vec3 boneR1 = cross(boneDy, normalW), boneR2 = cross(normalW, boneDx);
        float boneDet = dot(boneDx, boneR1);
        vec3 boneGradient = dFdx(boneHeight) * boneR1 + dFdy(boneHeight) * boneR2;
        normalW = normalize(max(abs(boneDet), 1e-12) * normalW - sign(boneDet) * boneGradient);
      `,
    };
  }
}

export function applyNaturalBone(materials: Set<PBRMaterial>, radius: number) {
  for (const material of materials) {
    const isTooth = /canine|molar|premolar|incisor|tooth/i.test(material.name);
    material.albedoColor = Color3.FromHexString(isTooth ? "#eee8d8" : "#ded2b9").toLinearSpace();
    material.metallic = 0;
    material.roughness = isTooth ? 0.38 : 0.78;
    if (!isTooth) new BoneSurface(material, radius);
  }
}
