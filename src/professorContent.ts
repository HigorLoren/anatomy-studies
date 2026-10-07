import type { Question } from "./questions";

const SIMULATION_P1_ITEMS: Record<number, number[]> = {
  1: [1], 2: [3], 3: [5], 4: [8], 5: [9], 6: [10], 7: [11], 8: [12], 9: [13],
  10: [22], 11: [23], 12: [25], 13: [24], 14: [27], 15: [28], 16: [29], 17: [30], 18: [31],
  19: [32], 20: [33], 21: [38], 22: [39], 23: [43], 24: [44],
  25: [47], 26: [48], 27: [49], 28: [50], 29: [59], 30: [60], 31: [54, 55, 56, 57],
  32: [54, 55, 56, 57], 33: [64], 34: [61, 62, 63, 64], 35: [67, 68], 36: [66, 67],
  37: [66], 38: [42], 39: [39], 40: [38], 41: [38], 42: [11, 12], 43: [11, 12],
  44: [70], 45: [72, 73, 74], 46: [72, 73, 74], 47: [78], 48: [82, 85],
  49: [86, 87, 88], 50: [89, 90, 91, 92], 51: [54, 55, 56, 57], 52: [61, 62, 63, 64],
  53: [67, 68], 54: [38], 55: [38], 56: [72], 57: [78], 58: [11], 59: [12], 60: [61],
  61: [11, 12], 62: [30, 31], 63: [24, 25], 64: [29], 65: [43], 66: [45], 67: [68],
  68: [66], 69: [90, 91, 92], 70: [79],
};

const STRUCTURE_P1_ITEMS: Record<string, number[]> = {
  "Frontal bone": [1], "Parietal bone": [2], "Temporal bone": [3], "Occipital bone": [4],
  "Nasal bone": [6], "Maxilla bone": [7], "Zygomatic bone": [8], "Mandible bone": [9],
  "Body of sternum": [10], Atlas: [11], Axis: [12], Vertebra_C7: [13], Vertebra_C4: [14],
  Vertebra_T7: [15], Vertebra_L3: [16], sacrum: [17], Coccyx: [18],
  "Biceps brachii": [59], "Triceps brachii": [60], Supraspinatus: [54], Infraspinatus: [55],
  "Teres minor": [56], Subscapularis: [57], "Vastus lateralis": [61], "Vastus intermedius": [62],
  "Vastus medialis": [63], "Rectus femoris": [64], Gastrocnemius: [66], Soleus: [67],
};

type NameRule = { answer: string; accepted: string[]; incompleteAccepted: string[] };
const PROFESSOR_NAMES: Record<string, NameRule> = {
  "Osso mandíbula": {
    answer: "Osso mandíbula", accepted: ["osso mandibular"], incompleteAccepted: ["mandíbula", "mandibular"],
  },
  "Vértebra cervical atlas": {
    answer: "Vértebra cervical atlas",
    accepted: ["primeira vértebra cervical (atlas)", "1ª vértebra cervical C1 (atlas)",
      "1ª vértebra cervical (atlas)", "vértebra cervical C1 (atlas)"],
    incompleteAccepted: ["atlas", "C1", "vértebra atlas", "primeira vértebra cervical", "vértebra cervical C1"],
  },
  "Vértebra cervical áxis": {
    answer: "Vértebra cervical áxis",
    accepted: ["segunda vértebra cervical (áxis)", "2ª vértebra cervical C2 (áxis)",
      "2ª vértebra cervical (áxis)", "vértebra cervical C2 (áxis)"],
    incompleteAccepted: ["áxis", "C2", "vértebra áxis", "segunda vértebra cervical", "vértebra cervical C2"],
  },
  "Sétima vértebra cervical (proeminente)": {
    answer: "Sétima vértebra cervical (proeminente)",
    accepted: ["vértebra proeminente", "sétima vértebra cervical", "vértebra cervical C7",
      "7ª vértebra cervical C7 (proeminente)", "7ª vértebra cervical (proeminente)"],
    incompleteAccepted: ["C7", "proeminente"],
  },
  "Osso sacro": {
    answer: "Osso sacro", accepted: ["vértebras sacrais", "(osso sacro) vértebras sacrais"],
    incompleteAccepted: ["sacro"],
  },
  "Osso cóccix": {
    answer: "Osso cóccix", accepted: ["vértebras coccígeas", "(osso cóccix) vértebras coccígeas"],
    incompleteAccepted: ["cóccix"],
  },
};


function professorName(name: string) {
  return PROFESSOR_NAMES[Object.keys(PROFESSOR_NAMES)
    .find(key => key.toLowerCase() === name.toLowerCase()) ?? ""];
}

// Uma nomenclatura para a prática original, o simulado e o complemento da P1.
export function alignProfessorQuestion(question: Question): Question {
  let aligned: Question = { ...question, p1Items: professorItems(question) };
  const key = question.answer === "Mandíbula" ? "Osso mandíbula"
    : question.answer === "Vértebra proeminente" ? "Sétima vértebra cervical (proeminente)"
      : question.answer;
  const rule = professorName(key);
  if (rule && question.kind !== "identify") aligned = { ...aligned, ...rule };
  if ([27, 68].includes(question.sourceNumber ?? 0)) {
    aligned = { ...aligned, answer: `Músculo ${question.answer.toLowerCase()}` };
  }
  aligned = alignMuscleNames(aligned);
  return alignGroupNames(aligned);
}

function alignMuscleNames(aligned: Question): Question {
  if (aligned.answer.startsWith("Músculo ")) {
    const full = [aligned.answer, ...aligned.accepted].filter(name => name.startsWith("músculo ") || name.startsWith("Músculo "));
    const short = [aligned.answer, ...aligned.accepted].map(name => name.replace(/^músculo /i, ""));
    aligned = { ...aligned, accepted: full.filter(name => name !== aligned.answer),
      incompleteAccepted: [...new Set([...(aligned.incompleteAccepted ?? []), ...short])] };
  }
  return aligned;
}

function alignGroupNames(aligned: Question): Question {
  if (aligned.answerGroups) {
    const groups = aligned.answerGroups.map(group => {
      const nameRule = professorName(group[0]);
      return nameRule ? [nameRule.answer, ...nameRule.accepted] : group;
    });
    const shortGroups = groups.map((group, index) => {
      const nameRule = professorName(group[0]);
      return nameRule?.incompleteAccepted
        ?? aligned.incompleteAnswerGroups?.[index]
        ?? group.filter(name => /^músculo /i.test(name)).map(name => name.replace(/^músculo /i, ""));
    });
    aligned = { ...aligned, answerGroups: groups,
      incompleteAnswerGroups: shortGroups.some(group => group.length) ? shortGroups : undefined };
  }
  return aligned;
}

function professorItems(question: Question) {
  const target = question.highlight ?? question.markers?.[Number(question.answer) - 1];
  return question.p1Items
    ?? (question.sourceNumber ? SIMULATION_P1_ITEMS[question.sourceNumber] : undefined)
    ?? (target ? STRUCTURE_P1_ITEMS[target] : undefined);
}
