import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

let source = readFileSync(new URL("../src/questions.ts", import.meta.url), "utf8");
source = source.replace('import { createMuscleQuestions, muscleNamingQuestion } from "./muscles";',
  readFileSync(new URL("../src/muscles.ts", import.meta.url), "utf8"));
for (let part = 1; part <= 3; part++) {
  source = source.replace(
    `import { SIMULADO_PART_${part} } from "./simuladoPart${part}";`,
    readFileSync(new URL(`../src/simuladoPart${part}.ts`, import.meta.url), "utf8"),
  );
}
source += readFileSync(new URL("../src/practicalHints.ts", import.meta.url), "utf8");
source += readFileSync(new URL("../src/answerBlanks.ts", import.meta.url), "utf8");
source += readFileSync(new URL("../src/answerIssue.ts", import.meta.url), "utf8")
  .replace('import { classifyAnswer, normalizeAnswer, type Question } from "./questions";', "");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { QUESTION_BANK, classifyAnswer, isCorrect, practicalHintBones, allBlanksFilled, answerIssue,
  MUSCLES, MUSCLE_DISTRACTORS, muscleExposure, questionMuscleTarget } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const named = (highlight) => QUESTION_BANK.find(
  (question) => question.kind === "name" && question.highlight === highlight,
);

test("cervical identifies the region; vertebra alone does not", () => {
  const question = named("Vertebra_C4");
  assert.equal(classifyAnswer(question, "Cervical"), "incomplete");
  assert.equal(classifyAnswer(question, "Vértebra"), "incorrect");
  assert.equal(classifyAnswer(question, "Vértebra cervical"), "incomplete");
  assert.equal(classifyAnswer(question, "VERTEBRA CERVICAL TIPICA!"), "correct");
  assert.equal(classifyAnswer(question, "Vértebra lombar"), "incorrect");
  assert.equal(classifyAnswer(question, ""), "incorrect");
});

test("short names require their complete anatomical names", () => {
  for (const [highlight, short, full] of [
    ["Nasal bone", "nasal", "osso nasal"],
    ["Mandible bone", "mandíbula", "osso mandíbula"],
    ["Vertebra_T7", "torácica", "vértebra torácica"],
    ["Vertebra_L3", "lombar", "vértebra lombar"],
    ["sacrum", "sacro", "osso sacro"],
    ["Coccyx", "cóccix", "osso cóccix"],
    ["Atlas", "atlas", "vértebra cervical atlas"],
  ]) {
    const question = named(highlight);
    assert.equal(classifyAnswer(question, short), "incomplete", short);
    assert.equal(isCorrect(question, short), false, short);
    assert.equal(classifyAnswer(question, full), "correct", full);
  }
});

test("generic or neighboring structures are not nearly correct", () => {
  assert.equal(classifyAnswer(named("Body of sternum"), "esterno"), "incorrect");
  assert.equal(classifyAnswer(named("Atlas"), "áxis"), "incorrect");
  assert.equal(classifyAnswer(named("Nasal bone"), "osso"), "incorrect");
});

test("muscle abbreviations preserve singular and plural", () => {
  const single = {
    ...named("Vertebra_C4"), answer: "Músculo bíceps braquial",
    accepted: [], incompleteAccepted: ["bíceps braquial"],
  };
  const plural = { ...single, answer: "Músculos intercostais", incompleteAccepted: [] };
  assert.equal(classifyAnswer(single, "m. bíceps braquial"), "correct");
  assert.equal(classifyAnswer(single, "M.  BICEPS BRAQUIAL."), "correct");
  assert.equal(classifyAnswer(single, "bíceps braquial"), "incomplete");
  assert.equal(classifyAnswer(single, "Mm. bíceps braquial"), "incorrect");
  assert.equal(classifyAnswer(plural, "Mm. intercostais"), "correct");
  assert.equal(classifyAnswer(plural, "m. intercostais"), "incorrect");
});

test("every canonical answer and complete alias remains correct", () => {
  for (const question of QUESTION_BANK) {
    assert.equal(classifyAnswer(question, question.answer), "correct", question.id);
    for (const answer of question.accepted) {
      assert.equal(classifyAnswer(question, answer), "correct", `${question.id}: ${answer}`);
    }
    for (const answer of question.incompleteAccepted ?? []) {
      assert.equal(classifyAnswer(question, answer), "incomplete", `${question.id}: ${answer}`);
    }
  }
});

test("number identification and complete phrases retain exact correction", () => {
  const question = QUESTION_BANK.find((item) => item.kind === "identify");
  assert.equal(classifyAnswer(question, question.answer), "correct");
  assert.equal(classifyAnswer(question, "frontal"), "incorrect");
  const phrase = QUESTION_BANK.find((item) => item.kind === "complete");
  assert.equal(classifyAnswer(phrase, "neurocranio"), "correct");
  assert.equal(classifyAnswer(phrase, "crânio"), "incorrect");
});

test("named cervical vertebrae accept their complete alternative names", () => {
  assert.equal(classifyAnswer(named("Atlas"), "Vertebra Atlas"), "incomplete");
  assert.equal(classifyAnswer(named("Axis"), "Vértebra áxis"), "incomplete");
  assert.equal(classifyAnswer(named("Atlas"), "Atlas"), "incomplete");
  assert.equal(classifyAnswer(named("Axis"), "Áxis"), "incomplete");
});

test("identification has at least five alternatives and preserves its answer after shuffling", () => {
  for (const [index, question] of QUESTION_BANK.entries()) {
    if (question.kind !== "identify") continue;
    const markers = question.markers ?? [
      "Frontal bone", "Nasal bone", "Zygomatic bone", "Maxilla bone", "Mandible bone",
    ];
    assert(markers.length >= 5, question.id);
    assert.equal(new Set(markers).size, markers.length);
    if (question.category !== "spine") continue;
    assert.equal(markers.length, 6);
    assert.deepEqual(question.isolatedBones, markers);
    const namedQuestion = QUESTION_BANK[index + 1];
    assert.equal(markers[Number(question.answer) - 1], namedQuestion.highlight);
    assert.equal(question.markerNames[Number(question.answer) - 1], namedQuestion.answer);
  }
});

const simulated = (number) => QUESTION_BANK.find((question) => question.sourceNumber === number);

test("the imported simulation contains all 70 questions with unique IDs", () => {
  assert.equal(QUESTION_BANK.length, 115);
  assert.equal(new Set(QUESTION_BANK.map((question) => question.id)).size, 115);
  for (let number = 1; number <= 70; number++) assert(simulated(number));
});

test("muscle identification and naming use verified GLB nodes, including all heads", () => {
  for (const model of ["upper", "lower"]) {
    const buffer = readFileSync(new URL(`../public/${model}-limb.glb`, import.meta.url));
    const glb = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
    const modelId = `${model}-muscles-practice`;
    const muscles = QUESTION_BANK.filter((question) => question.model === modelId);
    assert.equal(muscles.length, 12);
    const naming = muscles.filter((question) => question.kind === "name");
    const identification = muscles.filter((question) => question.kind === "identify");
    for (const question of identification) {
      assert.equal(question.markers.length, 6);
      assert.equal(question.isolatedBones, undefined);
      const target = question.markers[Number(question.answer) - 1];
      assert(naming.some((item) => item.highlight === target));
    }
    for (const question of naming) {
      assert.equal(question.isolatedBones, undefined);
      const parts = question.highlight === "Biceps brachii"
        ? ["Long head of biceps brachii", "Short head of biceps brachii"]
        : question.highlight === "Triceps brachii"
          ? ["Long head of triceps brachii", "Lateral head of triceps brachii", "Medial head of triceps brachii"]
          : question.highlight === "Gastrocnemius"
            ? ["Lateral head of gastrocnemius", "Medial head of gastrocnemius"]
            : [question.highlight + (question.highlight === "Rectus femoris" ? "" : " muscle")];
      for (const part of parts) {
        assert(glb.nodes.some((node) => node.name === `${part}.r` && node.mesh !== undefined), part);
      }
    }
  }
  assert.equal(simulated(29).highlight, "Biceps brachii");
  assert.equal(simulated(30).highlight, "Triceps brachii");
  for (const number of [25, 26, 27, 28]) assert.equal(simulated(number).model, undefined);
});

test("muscle identification keeps six alternatives present in the prepared dissection", () => {
  for (const question of QUESTION_BANK.filter((item) => item.model?.endsWith("-muscles-practice"))) {
    const target = questionMuscleTarget(question);
    assert(target, question.id);
    const removed = muscleExposure(target);
    for (const key of question.markers ?? [target]) {
      const muscle = [...MUSCLES, ...MUSCLE_DISTRACTORS].find((item) => item.key === key);
      assert(muscle, key);
      assert(muscle.nodes.every((node) => !removed.includes(node)), `${question.id}: ${key}`);
    }
    if (question.kind === "identify") {
      assert.equal(question.markers.length, 6);
      assert.equal(question.markerNames[Number(question.answer) - 1], `o músculo ${question.title
        .replace("Qual número indica o músculo ", "").replace(/\?$/, "")}`);
    }
  }
});

test("multiple blanks accept separators and preserve meaningful order", () => {
  assert.equal(classifyAnswer(simulated(31), "m. subescapular, m. supraespinal, m. redondo menor e m. infraespinal"), "correct");
  assert.equal(classifyAnswer(simulated(31), "supraespinal; supraespinal; redondo menor; subescapular"), "incorrect");
  assert.equal(classifyAnswer(simulated(42), "vértebra cervical atlas e vértebra cervical axis"), "correct");
  assert.equal(classifyAnswer(simulated(42), "vértebra cervical áxis; vértebra cervical atlas"), "incorrect");
  assert.equal(classifyAnswer(simulated(62), "medial; lateral"), "correct");
  assert.equal(classifyAnswer(simulated(62), "lateral; medial"), "incorrect");
  assert.equal(classifyAnswer(simulated(69), "fibular comum e tibial"), "correct");
  assert.equal(classifyAnswer(simulated(69), "tibial"), "incorrect");
});

test("open examples accept all four rotator cuff muscles", () => {
  for (const answer of ["supraespinal", "infraespinal", "redondo menor", "subescapular"])
    assert.equal(classifyAnswer(simulated(51), `m. ${answer}`), "correct");
  assert.equal(classifyAnswer(simulated(51), "redondo maior"), "incorrect");
});

test("muscle blanks require full names and accept singular abbreviations", () => {
  for (const [number, name] of [[33, "reto femoral"], [35, "sóleo"],
    [37, "gastrocnêmio"], [51, "supraespinal"], [53, "sóleo"], [60, "vasto lateral"]]) {
    const question = simulated(number);
    assert.equal(classifyAnswer(question, name), "incomplete");
    assert.equal(classifyAnswer(question, `Músculo ${name}`), "correct");
    assert.equal(classifyAnswer(question, `m. ${name}`), "correct");
    assert.equal(classifyAnswer(question, `Mm. ${name}`), "incorrect");
    assert(!/músculos? ____/i.test(question.title));
  }
});

test("rotator cuff list accepts a plural prefix or individual singular prefixes", () => {
  const question = simulated(31);
  assert.equal(classifyAnswer(question,
    "Mm. supraespinal, infraespinal, redondo menor e subescapular"), "correct");
  assert.equal(classifyAnswer(question,
    "Músculos subescapular; redondo menor; infraespinal; supraespinal"), "correct");
  assert.equal(classifyAnswer(question,
    "supraespinal; infraespinal; redondo menor; subescapular"), "incorrect");
  assert.equal(classifyAnswer(question,
    "m. supraespinal, infraespinal, redondo menor e subescapular"), "incorrect");
});

test("practical naming hides descriptive clues and isolates imported bones", () => {
  for (const question of QUESTION_BANK.filter((item) => item.kind === "name" && item.highlight)) {
    assert.equal(question.title, "Denomine a estrutura marcada.");
    assert(question.instruction.includes("massinha azul"));
    assert(question.explanation.length > 0);
  }
  for (const number of [7, 8, 9, 10, 12, 13, 14, 16, 17, 18]) {
    const question = simulated(number);
    assert.deepEqual(question.isolatedBones, [question.highlight]);
  }
});

test("skull bones remain assembled in practical naming questions", () => {
  for (const number of [1, 2, 4, 5]) {
    const question = simulated(number);
    assert.equal(question.model, "overview-skull-natural");
    assert.equal(question.isolatedBones, undefined);
    assert(question.highlight);
    assert.equal(question.title, "Denomine a estrutura marcada.");
  }
});

test("hints add at most two neighbors that exist in the question model", () => {
  for (const question of QUESTION_BANK) {
    const neighbors = practicalHintBones(question);
    assert(neighbors.length <= 2);
    if (!neighbors.length) continue;
    assert.equal(question.kind, "name");
    assert.equal(question.isolatedBones.length, 1);
    assert(!neighbors.includes(question.highlight));
    const file = question.model === "spine-practice"
      ? "pectoral-back-thorax-bones-costal-cart" : "overview-skeleton";
    const glb = readFileSync(new URL(`../public/${file}.glb`, import.meta.url));
    const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
    const materials = json.materials.map((material) => material.name.replace(/\.\d+$/, ""));
    for (const bone of neighbors) assert(materials.includes(bone), `${question.id}: ${bone}`);
  }
  for (const number of [1, 2, 4, 5]) assert.deepEqual(practicalHintBones(simulated(number)), []);
});

test("meninges and brainstem components can be supplied in either order", () => {
  for (const answer of ["pia-máter; aracnoide-máter", "aracnoide-máter; pia-máter",
    "pia mater; aracnoide mater"]) {
    assert.equal(classifyAnswer(simulated(44), answer), "correct");
  }
  assert.equal(classifyAnswer(simulated(44), "pia-máter; pia-máter"), "incorrect");
  assert.equal(classifyAnswer(simulated(45), "bulbo; ponte"), "correct");
  assert.equal(classifyAnswer(simulated(42), "vértebra cervical áxis; vértebra cervical atlas"), "incorrect");
  assert.equal(classifyAnswer(simulated(62), "lateral; medial"), "incorrect");
});

test("inline blank submission requires every field to be filled", () => {
  assert.equal(allBlanksFilled(simulated(44), ""), false);
  assert.equal(allBlanksFilled(simulated(44), ";"), false);
  assert.equal(allBlanksFilled(simulated(44), "pia-máter;"), false);
  assert.equal(allBlanksFilled(simulated(44), ";aracnoide-máter"), false);
  assert.equal(allBlanksFilled(simulated(44), "pia-máter;aracnoide-máter"), true);
  assert.equal(allBlanksFilled(simulated(31), "m. supraespinal;m. infraespinal"), false);
});

test("feedback identifies a missing muscle prefix and missing anatomical qualifiers", () => {
  assert.match(answerIssue(simulated(33), "reto femoral"), /Faltou a palavra “músculo”/);
  assert.match(answerIssue(simulated(33), "músculo reto"), /“femoral”/);
  assert.match(answerIssue(simulated(34), "músculo quadríceps"), /“femoral”/);
  assert.equal(answerIssue(simulated(33), "m. reto femoral"), "");
  assert.match(answerIssue(simulated(33), "músculo sóleo"), /não corresponde/);
  assert.match(answerIssue(named("Vertebra_C4"), "vértebra cervical"), /“típica”/);
});

test("feedback identifies missing list components, repeated terms and swapped associations", () => {
  assert.match(answerIssue(simulated(44), "pia-máter"), /aracnoide/);
  assert.match(answerIssue(simulated(44), "pia-máter; pia-máter"), /aracnoide/);
  assert.equal(answerIssue(simulated(44), "pia-máter; aracnoide-máter"), "");
  assert.match(answerIssue(simulated(42), "vértebra cervical áxis; vértebra cervical atlas"), /lacunas trocadas/);
  assert.match(answerIssue(simulated(31),
    "supraespinal; m. infraespinal; m. redondo menor; m. subescapular"), /Faltou a palavra “músculo”/);
  assert.match(answerIssue(simulated(31), "m. supraespinal; m. infraespinal"), /redondo menor/);
});

test("atlas requires its full anatomical name throughout the bank", () => {
  for (const question of [named("Atlas"), simulated(7), simulated(58)]) {
    assert.equal(question.answer, "Vértebra cervical atlas");
    assert.equal(classifyAnswer(question, "Vertebra cervical atlas"), "correct");
    assert.equal(classifyAnswer(question, "atlas"), "incomplete");
    assert.equal(classifyAnswer(question, "vértebra atlas"), "incomplete");
    assert.match(answerIssue(question, "atlas"), /vértebra cervical/i);
  }
  for (const number of [42, 43, 61]) {
    assert.equal(classifyAnswer(simulated(number), "vértebra cervical atlas; vértebra cervical áxis"), "correct");
    assert.notEqual(classifyAnswer(simulated(number), "atlas; áxis"), "correct");
    assert.match(answerIssue(simulated(number), "atlas; áxis"), /vértebra cervical/i);
  }
});

test("axis requires its full anatomical name in every naming and completion question", () => {
  for (const question of [named("Axis"), simulated(8), simulated(59)]) {
    assert.equal(question.answer, "Vértebra cervical áxis");
    assert.equal(classifyAnswer(question, "Vertebra cervical axis"), "correct");
    for (const short of ["axis", "áxis", "vértebra áxis", "C2"])
      assert.equal(classifyAnswer(question, short), "incomplete");
    assert.match(answerIssue(question, "axis"), /vértebra cervical/i);
  }
  for (const number of [42, 43, 61]) {
    assert.equal(classifyAnswer(simulated(number),
      "vértebra cervical atlas; vértebra cervical axis"), "correct");
    assert.notEqual(classifyAnswer(simulated(number), "vértebra cervical atlas; axis"), "correct");
    assert.match(answerIssue(simulated(number), "vértebra cervical atlas; axis"), /vértebra cervical/i);
  }
});
