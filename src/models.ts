export const MODELS = [
  { value: "overview-colored-skull", label: "Crânio · Colorido" },
  { value: "overview-skull", label: "Crânio · Sem cores" },
  { value: "overview-skull-natural", label: "Crânio · Osso natural" },
  { value: "spine-practice", label: "Coluna vertebral" },
  { value: "thorax-practice", label: "Tórax" },
] as const;

export type ModelId = (typeof MODELS)[number]["value"] | "spine-cervical-practice";
export const DEFAULT_MODEL: ModelId = "overview-skull-natural";
