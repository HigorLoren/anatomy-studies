import type { ModelId } from "../models";

export type ViewerStatus = "loading" | "ready" | "error";

export type BoneSelection = { name: string; side: "E" | "D" | null };

export type Marker = {
  number: number;
  x: number;
  y: number;
  size: number;
  visible: boolean;
};

export type Exercise = {
  exploring?: boolean;
  markers?: string[];
  clayTarget?: string;
  isolatedBones?: string[];
  preserveLayout?: boolean;
  exposeDeepMuscles?: boolean;
  muscleTarget?: string;
  highlight?: string;
  highlightColor?: "blue" | "red" | "green";
  correctHighlight?: string;
} | null;

export type Viewer = {
  fps(): number;
  paint(enabled: boolean): void;
  load(model: ModelId): void;
  exercise(value: Exercise): void;
  reset(view?: "default" | "question"): void;
  zoom(factor: number): void;
  focusNumber(number: number): void;
  dispose(): void;
};
