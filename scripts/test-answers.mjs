import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/questions.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { QUESTION_BANK, classifyAnswer, isCorrect } = await import(
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
    ["Atlas", "atlas", "primeira vértebra cervical"],
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
  assert.equal(classifyAnswer(named("Atlas"), "Vertebra Atlas"), "correct");
  assert.equal(classifyAnswer(named("Axis"), "Vértebra áxis"), "correct");
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
