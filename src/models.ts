export const MODELS = [
  { value: "overview-colored-skull", label: "Crânio · Colorido" },
  { value: "overview-skull-natural", label: "Crânio" },
  { value: "exploded-skull", label: "Crânio · Explodido" },
  { value: "spine-practice", label: "Coluna vertebral" },
  { value: "spine-pieces", label: "Vértebras" },
  { value: "thorax-practice", label: "Tórax" },
] as const;

export type ModelId =
  | (typeof MODELS)[number]["value"]
  | "spine-cervical-practice"
  | "skeleton-practice"
  | "upper-limb-practice"
  | "lower-limb-practice";
export const DEFAULT_MODEL: ModelId = "overview-skull-natural";

export const SPINE_PIECES = [
  "Atlas",
  "Axis",
  "Vertebra_C7",
  "Vertebra_C4",
  "Vertebra_T7",
  "Vertebra_L3",
];
