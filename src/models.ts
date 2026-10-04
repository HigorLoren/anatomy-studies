export const MODELS = [
  { value: "overview-colored-skull", label: "Colorido" },
  { value: "overview-skull", label: "Sem cores" },
  { value: "overview-skull-natural", label: "Osso natural" },
] as const;

export type ModelId = (typeof MODELS)[number]["value"];
export const DEFAULT_MODEL: ModelId = "overview-skull-natural";
