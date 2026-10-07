import type { Question } from "./questions";

// No máximo dois vizinhos; o crânio já é apresentado como conjunto.
const NEIGHBORS: Record<string, string[]> = {
  humerus: ["Scapula", "radius"],
  radius: ["ulna", "humerus"],
  ulna: ["radius", "humerus"],
  femur: ["Hip bone", "Tibia"],
  Patella: ["femur", "Tibia"],
  Tibia: ["Fibula", "femur"],
  Fibula: ["Tibia", "Talus"],
  Atlas: ["Axis"],
  Axis: ["Atlas", "Vertebra_C3"],
  Vertebra_C7: ["Vertebra_C6"],
  Vertebra_C4: ["Vertebra_C3", "Vertebra_C5"],
  Vertebra_T7: ["Vertebra_T6", "Vertebra_T8"],
  Vertebra_L3: ["Vertebra_L2", "Vertebra_L4"],
  sacrum: ["Vertebra_L5", "Coccyx"],
  Coccyx: ["sacrum"],
};

export function practicalHintBones(question: Question) {
  if (question.kind !== "name" || question.isolatedBones?.length !== 1) return [];
  return NEIGHBORS[question.highlight ?? ""] ?? [];
}
