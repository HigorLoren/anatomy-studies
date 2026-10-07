import { QUESTION_BANK } from "./questions";
import { MODELS, type ModelId } from "./models";
import { boneSelection } from "./viewer/bones";
import { practicalHintBones } from "./practicalHints";
import type { Exercise } from "./viewer/types";

export type ExplorationView = { id: string; label: string; exercise: Exercise };
const assembled: ExplorationView = {
  id: "assembled", label: "Região completa", exercise: { exploring: true },
};

function muscleViews(model: ModelId): ExplorationView[] {
  const upper = model === "upper-muscles-practice";
  const exposed: Exercise = {
    exploring: true, exposeDeepMuscles: true, muscleTarget: "Biceps brachii",
  };
  return upper ? [
    { id: "prepared", label: "Músculos expostos", exercise: exposed },
    { id: "covers", label: "Com peças de cobertura", exercise: {
      ...exposed, exposeDeepMuscles: false,
    } },
  ] : [
    { id: "prepared", label: "Camada superficial", exercise: {
      exploring: true, exposeDeepMuscles: false,
    } },
    { id: "vastus", label: "Vasto intermédio exposto", exercise: {
      exploring: true, exposeDeepMuscles: true, muscleTarget: "Vastus intermedius",
    } },
    { id: "soleus", label: "Sóleo exposto", exercise: {
      exploring: true, exposeDeepMuscles: true, muscleTarget: "Soleus",
    } },
  ];
}

function boneViews(model: ModelId): ExplorationView[] {
  const base = model === "spine-cervical-practice" ? {
    ...assembled, exercise: { exploring: true, preserveLayout: true,
      isolatedBones: ["Atlas", "Axis", ...[3, 4, 5, 6, 7].map(n => `Vertebra_C${n}`)] },
  } : assembled;
  const views = new Map<string, ExplorationView>();
  for (const question of QUESTION_BANK) {
    if (question.model !== model || !question.isolatedBones?.length) continue;
    const keys = question.isolatedBones;
    const id = [...keys].sort().join("|");
    const names = keys.map(key => boneSelection(key, key).name);
    views.set(id, { id,
      label: keys.length === 1 ? names[0] : `Peças separadas: ${names.join(", ")}`,
      exercise: { exploring: true, isolatedBones: keys },
    });
    const neighbors = practicalHintBones(question);
    if (neighbors.length) views.set(`neighbors:${id}`, {
      id: `neighbors:${id}`, label: `${names[0]} com estruturas vizinhas`,
      exercise: { exploring: true, isolatedBones: [...keys, ...neighbors], preserveLayout: true },
    });
  }
  return [base, ...views.values()];
}

export const EXPLORATION_VIEWS = Object.fromEntries(MODELS.map(({ value }) => [
  value, value.endsWith("-muscles-practice") ? muscleViews(value) : boneViews(value),
])) as Record<ModelId, ExplorationView[]>;

export function explorationDescription(model: ModelId) {
  if (model.endsWith("-muscles-practice")) {
    return "Gire a região para estudar os músculos no contexto anatômico. Escolha uma camada para expor as estruturas profundas, como nas perguntas da prática.";
  }
  if (model.includes("spine") || model === "skeleton-practice") {
    return "Explore o conjunto ou escolha uma das peças usadas nas perguntas. Gire e aproxime para observar sua anatomia.";
  }
  return "Gire o modelo e use o zoom para examinar suas estruturas e as relações entre elas.";
}
