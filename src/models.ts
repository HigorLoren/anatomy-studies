export const MODELS = [
  { value: "overview-colored-skull", label: "Crânio · Colorido" },
  { value: "overview-skull-natural", label: "Crânio" },
  { value: "exploded-skull", label: "Crânio · Explodido" },
  { value: "spine-practice", label: "Coluna vertebral" },
  { value: "spine-pieces", label: "Vértebras" },
  { value: "thorax-practice", label: "Tórax" },
  { value: "spine-cervical-practice", label: "Coluna cervical" },
  { value: "skeleton-practice", label: "Esqueleto · Peças ósseas" },
  { value: "upper-limb-practice", label: "Membro superior · Ossos" },
  { value: "lower-limb-practice", label: "Membro inferior e pelve · Ossos" },
  { value: "upper-muscles-practice", label: "Membro superior · Músculos" },
  { value: "lower-muscles-practice", label: "Membro inferior · Músculos" },
] as const;

export type ModelId = (typeof MODELS)[number]["value"];
export const DEFAULT_MODEL: ModelId = "overview-skull-natural";

export const SPINE_PIECES = [
  "Atlas",
  "Axis",
  "Vertebra_C7",
  "Vertebra_C4",
  "Vertebra_T7",
  "Vertebra_L3",
];
