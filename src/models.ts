export const MODELS = [
  { value: "overview-colored-skull", label: "Crânio · Colorido" },
  { value: "overview-skull-natural", label: "Crânio" },
  { value: "exploded-skull", label: "Crânio · Explodido" },
  { value: "spine-practice", label: "Coluna vertebral" },
  { value: "thorax-practice", label: "Tórax" },
] as const;

export type ModelId = (typeof MODELS)[number]["value"] | "spine-cervical-practice";
export const DEFAULT_MODEL: ModelId = "overview-skull-natural";
