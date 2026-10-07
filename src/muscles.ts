import type { ModelId } from "./models";
import type { Question } from "./questions";

export const MUSCLES = [
  { key: "Biceps brachii", name: "bíceps braquial", model: "upper-muscles-practice", sourceNumber: 29,
    nodes: ["Long head of biceps brachii", "Short head of biceps brachii"] },
  { key: "Triceps brachii", name: "tríceps braquial", model: "upper-muscles-practice", sourceNumber: 30,
    nodes: ["Long head of triceps brachii", "Lateral head of triceps brachii", "Medial head of triceps brachii"] },
  { key: "Supraspinatus", name: "supraespinal", model: "upper-muscles-practice", nodes: ["Supraspinatus muscle"] },
  { key: "Infraspinatus", name: "infraespinal", model: "upper-muscles-practice", nodes: ["Infraspinatus muscle"] },
  { key: "Teres minor", name: "redondo menor", model: "upper-muscles-practice", nodes: ["Teres minor muscle"] },
  { key: "Subscapularis", name: "subescapular", model: "upper-muscles-practice", nodes: ["Subscapularis muscle"] },
  { key: "Rectus femoris", name: "reto femoral", model: "lower-muscles-practice", nodes: ["Rectus femoris"] },
  { key: "Vastus lateralis", name: "vasto lateral", model: "lower-muscles-practice", nodes: ["Vastus lateralis muscle"] },
  { key: "Vastus intermedius", name: "vasto intermédio", model: "lower-muscles-practice", nodes: ["Vastus intermedius muscle"] },
  { key: "Vastus medialis", name: "vasto medial", model: "lower-muscles-practice", nodes: ["Vastus medialis muscle"] },
  { key: "Gastrocnemius", name: "gastrocnêmio", model: "lower-muscles-practice",
    nodes: ["Lateral head of gastrocnemius", "Medial head of gastrocnemius"] },
  { key: "Soleus", name: "sóleo", model: "lower-muscles-practice", nodes: ["Soleus muscle"] },
] satisfies { key: string; name: string; model: ModelId; sourceNumber?: number; nodes: string[] }[];

export const MUSCLE_DISTRACTORS = [
  { key: "Sartorius", name: "sartório", model: "lower-muscles-practice", nodes: ["Sartorius muscle"] },
  { key: "Tibialis anterior", name: "tibial anterior", model: "lower-muscles-practice",
    nodes: ["Tibialis anterior muscle"] },
];

const SHOULDER_COVERS = [
  "Deltoid muscle", "Trapezius muscle", "Pectoralis major", "Pectoralis minor muscle",
  "Latissimus dorsi", "Serratus anterior muscle",
];

export function muscleExposure(target: string): string[] {
  if (MUSCLES.some((muscle) => muscle.key === target && muscle.model === "upper-muscles-practice")) {
    return SHOULDER_COVERS;
  }
  if (target === "Vastus intermedius") return ["Rectus femoris"];
  if (target === "Soleus") return ["Lateral head of gastrocnemius", "Medial head of gastrocnemius"];
  return [];
}

export function questionMuscleTarget(question: Question): string {
  return question.highlight ?? question.markers?.[Number(question.answer) - 1] ?? "";
}

export function muscleNamingQuestion(question: Question): Question {
  if (!question.sourceNumber) return question;
  const muscle = MUSCLES.find((item) => item.sourceNumber === question.sourceNumber);
  if (question.kind !== "name" || !muscle) return question;
  return { ...question, model: muscle.model, highlight: muscle.key };
}

export function createMuscleQuestions(): Question[] {
  return MUSCLES.flatMap((muscle) => {
    const category = muscle.model === "upper-muscles-practice" ? "upper" : "lower";
    const covers = muscleExposure(muscle.key);
    const group = [...MUSCLES, ...MUSCLE_DISTRACTORS].filter((item) =>
      item.model === muscle.model && !item.nodes.some((node) => covers.includes(node)),
    ).slice(0, 6);
    for (let index = group.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [group[index], group[other]] = [group[other], group[index]];
    }
    const number = String(group.indexOf(muscle) + 1);
    const identify: Question = {
      id: `muscle-identify-${muscle.key}`, category, kind: "identify", model: muscle.model,
      title: `Qual número indica o músculo ${muscle.name}?`,
      instruction: "Observe a região com os músculos expostos, gire a peça e selecione o número correspondente.",
      markers: group.map((item) => item.key),
      markerNames: group.map((item) => `o músculo ${item.name}`),
      answer: number, accepted: [number],
      explanation: `O ponto ${number} indica o músculo ${muscle.name}.`,
    };
    if (muscle.sourceNumber) return [identify];
    return [identify, {
      id: `muscle-name-${muscle.key}`, category, kind: "name", model: muscle.model,
      title: "Denomine o músculo marcado na peça.",
      instruction: "Gire o modelo e escreva o nome anatômico completo.",
      highlight: muscle.key,
      answer: `Músculo ${muscle.name}`, accepted: [], incompleteAccepted: [muscle.name],
      explanation: `A estrutura marcada é o músculo ${muscle.name}.`,
    }];
  });
}

export function preparedMuscleFile(model: ModelId, target = "", exposed = true): string {
  if (model === "upper-muscles-practice") {
    return exposed ? "upper-muscles-prepared" : "upper-muscles-uncovered-base";
  }
  if (exposed && target === "Vastus intermedius") return "lower-muscles-vastus-intermedius";
  if (exposed && target === "Soleus") return "lower-muscles-soleus";
  return "lower-muscles-prepared";
}
