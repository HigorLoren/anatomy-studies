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
  markers?: string[];
  highlight?: string;
  highlightColor?: "blue" | "red" | "green";
  correctHighlight?: string;
} | null;

export type Viewer = {
  load(model: ModelId): void;
  exercise(value: Exercise): void;
  reset(view?: "default" | "question"): void;
  dispose(): void;
};
