import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

let source = readFileSync(new URL("../src/questions.ts", import.meta.url), "utf8");
source = source.replace('import { alignProfessorQuestion } from "./professorContent";',
  readFileSync(new URL("../src/professorContent.ts", import.meta.url), "utf8"));
source = source.replace('import { P1_COMPLEMENT } from "./p1Questions";',
  readFileSync(new URL("../src/p1Questions.ts", import.meta.url), "utf8"));
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
source += readFileSync(new URL("../src/app/learning.ts", import.meta.url), "utf8")
  .replace('import { filterQuestions, type Question, type TestConfig } from "../questions";', "");
source += readFileSync(new URL("../src/models.ts", import.meta.url), "utf8");
source += readFileSync(new URL("../src/viewer/bones.ts", import.meta.url), "utf8")
  .replace(/^import.*$/gm, "");
source += readFileSync(new URL("../src/exploration.ts", import.meta.url), "utf8")
  .replace(/^import.*$/gm, "");
source += readFileSync(new URL("../src/anatomyExplanations.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { QUESTION_BANK, classifyAnswer, isCorrect, practicalHintBones, allBlanksFilled, answerIssue,
  MUSCLES, MUSCLE_DISTRACTORS, muscleExposure, questionMuscleTarget,
  filterQuestions, createTest, recordAnswer, testPool, restoreLearning, points, formatPoints, MODELS, EXPLORATION_VIEWS, preparedMuscleFile, boneSelection, P1_COMPLEMENT, anatomyReview } = await import(
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
  assert.equal(QUESTION_BANK.length, 115 + P1_COMPLEMENT.length);
  assert.equal(new Set(QUESTION_BANK.map((question) => question.id)).size, QUESTION_BANK.length);
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

test("soleus identification offers six muscles in the leg, including gastrocnemius", () => {
  const question = QUESTION_BANK.find(item => item.id === "muscle-identify-Soleus");
  assert.deepEqual([...question.markers].sort(), ["Soleus", "Gastrocnemius", "Tibialis anterior",
    "Fibularis longus", "Fibularis brevis", "Extensor digitorum longus"].sort());
  assert.equal(question.markers[Number(question.answer) - 1], "Soleus");
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
    "supraespinal; infraespinal; redondo menor; subescapular"), "incomplete");
  assert.equal(classifyAnswer(question,
    "m. supraespinal, infraespinal, redondo menor e subescapular"), "incomplete");
});

test("practical naming hides descriptive clues and isolates imported bones", () => {
  for (const question of QUESTION_BANK.filter((item) => item.kind === "name" && item.highlight)) {
    assert.equal(question.title, "Denomine a estrutura marcada.");
    assert(question.instruction.includes(question.model?.endsWith("-muscles-practice")
      ? "bandeirinha azul" : "massinha azul"));
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


test("tests combine regions and kinds, reject empty selections, and cap actual question count", () => {
  const config = { categories: ["upper", "lower"], kinds: ["identify", "name"], count: 20 };
  const pool = filterQuestions(config);
  assert(pool.some(q => q.category === "upper"));
  assert(pool.some(q => q.category === "lower"));
  assert(pool.every(q => config.categories.includes(q.category) && config.kinds.includes(q.kind)));
  assert.equal(filterQuestions({ categories: [], kinds: ["name"] }).length, 0);
  assert.equal(filterQuestions({ categories: ["upper"], kinds: [] }).length, 0);
  assert.equal(createTest(config).length, 20);
  assert.equal(new Set(createTest(config).map(q => q.id)).size, 20);
  const small = { categories: ["abdomen"], kinds: ["name"], count: 20 };
  assert.equal(createTest(small).length, filterQuestions(small).length);
  assert.equal(points(20), 0.5);
  assert.equal(points(5), 2);
  assert.equal(points(createTest(small).length) * createTest(small).length, 10);
  assert.equal(formatPoints(3 * points(3)), "10");
});

test("error review prioritizes recurring errors and removes a question after a correct retry", () => {
  const [first, second, unseen] = QUESTION_BANK;
  let records = recordAnswer({}, first.id, false);
  records = recordAnswer(records, second.id, false);
  records = recordAnswer(records, second.id, false);
  assert.deepEqual(testPool({ review: true }, records).map(q => q.id), [second.id, first.id]);
  records = recordAnswer(records, second.id, true);
  assert.deepEqual(testPool({ review: true }, records).map(q => q.id), [first.id]);
  assert(!testPool({ review: true }, records).some(q => q.id === unseen.id));
  assert.deepEqual(records[second.id], { attempts: 3, errors: 2, lastCorrect: true });
  assert.equal(testPool({ review: true, categories: [] }, records).length, 0);
});

test("saved progress preserves skipped answers, drafts and position across a JSON round trip", () => {
  const [first, second, third] = QUESTION_BANK;
  const session = { ids: [first.id, second.id, third.id], index: 2,
    answers: [first.answer, "", null], draft: "rascunho" };
  const records = recordAnswer({}, second.id, false);
  const config = { count: 3, categories: [first.category], kinds: [first.kind], review: true };
  const saved = restoreLearning(JSON.stringify({ version: 1, records, session, config }), QUESTION_BANK);
  assert.deepEqual(saved.session, session);
  assert.deepEqual(saved.records, records);
  assert.deepEqual(saved.config, config);
  assert.equal(saved.session.answers[1], "");
  assert.equal(saved.session.answers[2], null);
});

test("invalid storage and outdated question IDs are handled without losing valid history", () => {
  assert.equal(restoreLearning("{broken", QUESTION_BANK).session, null);
  assert.equal(restoreLearning(JSON.stringify({ version: 99 }), QUESTION_BANK).session, null);
  const first = QUESTION_BANK[0];
  const records = { [first.id]: { attempts: 1, errors: 1, lastCorrect: false },
    removed: { attempts: 2, errors: 2, lastCorrect: false }, bad: { attempts: -1 } };
  const stored = { version: 1, records, session: {
    ids: [first.id, "removed"], index: 0, answers: [], draft: "" },
    config: { count: 100, categories: ["unknown", first.category], kinds: ["unknown"] } };
  const saved = restoreLearning(JSON.stringify(stored), QUESTION_BANK);
  assert.deepEqual(Object.keys(saved.records), [first.id]);
  assert.equal(saved.session, null);
  assert.equal(saved.config.count, 100);
  assert.deepEqual(saved.config.categories, [first.category]);
  assert.deepEqual(saved.config.kinds, []);
});


test("exploration exposes every question model and isolated bone layout without quiz markers", () => {
  const models = new Set(MODELS.map(option => option.value));
  for (const question of QUESTION_BANK) {
    if (!question.model) continue;
    assert(models.has(question.model), question.model);
    if (question.isolatedBones?.length) {
      assert(EXPLORATION_VIEWS[question.model].some(view =>
        [...(view.exercise?.isolatedBones ?? [])].sort().join("|") ===
        [...question.isolatedBones].sort().join("|")), question.id);
      const neighbors = practicalHintBones(question);
      if (neighbors.length) assert(EXPLORATION_VIEWS[question.model].some(view =>
        view.exercise.preserveLayout &&
        [...view.exercise.isolatedBones].sort().join("|") ===
        [...question.isolatedBones, ...neighbors].sort().join("|")), question.id);
    }
  }
  for (const views of Object.values(EXPLORATION_VIEWS)) {
    for (const view of views) {
      assert(view.exercise.exploring);
      assert(!view.exercise.clayTarget && !view.exercise.markers && !view.exercise.highlight);
    }
  }
});

test("exploration offers all five prepared muscle files and deep lower limb views", () => {
  const files = [];
  for (const model of ["upper-muscles-practice", "lower-muscles-practice"]) {
    for (const { exercise } of EXPLORATION_VIEWS[model]) {
      files.push(preparedMuscleFile(model, exercise.muscleTarget, exercise.exposeDeepMuscles));
    }
  }
  assert.deepEqual(files.sort(), ["upper-muscles-prepared", "upper-muscles-uncovered-base",
    "lower-muscles-prepared", "lower-muscles-vastus-intermedius", "lower-muscles-soleus"].sort());
});


test("tests allow more than 20 questions and preserve large saved sessions", () => {
  assert.equal(createTest({ count: 30 }).length, 30);
  assert.equal(createTest({ count: 1000 }).length, QUESTION_BANK.length);
  assert.equal(createTest({ count: NaN }).length, 20);
  const questions = createTest({ count: 35 });
  const session = { ids: questions.map(q => q.id), index: 25,
    answers: questions.map((q, index) => index < 25 ? q.answer : null), draft: "rascunho" };
  const saved = restoreLearning(JSON.stringify({ version: 1, records: {}, session,
    config: { count: 35 } }), QUESTION_BANK);
  assert.deepEqual(saved.session, session);
  assert.equal(saved.config.count, 35);
  assert.equal(restoreLearning(null, QUESTION_BANK).config.count, 20);
  assert.equal(formatPoints(30 * points(30)), "10");
});

test("professor and atlas names are accepted without relaxing anatomical distinctions", () => {
  for (const [key, answers] of [
    ["Atlas", ["1ª Vértebra Cervical C1 (Atlas)", "primeira vértebra cervical (atlas)"]],
    ["Axis", ["2ª Vértebra Cervical C2 (Áxis)"]],
    ["Vertebra_C7", ["7ª Vértebra Cervical C7 (Proeminente)"]],
    ["sacrum", ["Vértebras sacrais", "(Osso Sacro) Vértebras Sacrais"]],
    ["Coccyx", ["Vértebras coccígeas", "(Osso Cóccix) Vértebras Coccígeas"]],
  ]) {
    for (const question of QUESTION_BANK.filter(q => q.kind === "name" && q.highlight === key)) {
      for (const answer of answers) assert.equal(classifyAnswer(question, answer), "correct", question.id);
      assert.equal(classifyAnswer(question, boneSelection(key, key).name), "correct", question.id);
    }
  }
  assert.equal(classifyAnswer(simulated(19), "sutura interparietal"), "correct");
  assert.equal(classifyAnswer(simulated(20), "sutura frontoparietal"), "correct");
  assert.equal(classifyAnswer(simulated(19), "sutura frontoparietal"), "incorrect");
  assert.equal(classifyAnswer(simulated(42),
    "1ª vértebra cervical C1 (atlas); 2ª vértebra cervical C2 (áxis)"), "correct");
  assert.equal(classifyAnswer(simulated(42), "atlas; áxis"), "incomplete");
  assert.equal(classifyAnswer(simulated(42), "áxis; atlas"), "incorrect");
});

test("short names receive consistent feedback in original and simulated questions", () => {
  for (const [highlight, number, answer] of [["Mandible bone", 5, "mandíbula"],
    ["Vertebra_C7", 9, "C7"]]) {
    assert.equal(classifyAnswer(named(highlight), answer), "incomplete");
    assert.equal(classifyAnswer(simulated(number), answer), "incomplete");
    assert.equal(classifyAnswer(named(highlight), simulated(number).answer), "correct");
  }
  for (const number of [25, 26, 27, 28, 29, 30, 68]) {
    const question = simulated(number);
    const short = question.answer.replace(/^músculo /i, "");
    assert.equal(classifyAnswer(question, short), "incomplete", question.id);
    assert.equal(classifyAnswer(question, `m. ${short}`), "correct", question.id);
  }
});

test("P1 complement covers missing items and preserves full list order and distinct components", () => {
  const covered = new Set(QUESTION_BANK.flatMap(question => question.p1Items ?? []));
  for (let item = 1; item <= 92; item++) assert(covered.has(item), `P1 item ${item}`);
  const find = id => QUESTION_BANK.find(question => question.id === id);
  for (const item of [34, 35, 36, 37, 46, 51, 52, 53, 58, 65, 69, 71, 75, 76, 77, 80, 81, 83, 84]) {
    assert(find(`p1-${item}`), item);
  }
  assert.equal(classifyAnswer(find("p1-26-componentes"), "púbis; ílio; ísquio"), "correct");
  assert.equal(classifyAnswer(find("p1-26-componentes"), "ílio; ílio; púbis"), "incorrect");
  assert.equal(classifyAnswer(find("p1-86-nervos"), "nervo ulnar; nervo radial; nervo mediano"), "correct");
  assert.equal(classifyAnswer(find("p1-86-nervos"), "ulnar; radial; mediano"), "incomplete");
  assert.equal(classifyAnswer(find("p1-86-nervos"), "nervo ulnar; nervo radial; nervo tibial"), "incorrect");
  assert.equal(classifyAnswer(find("p1-89-nervos"), "nervo tibial; nervo femoral; nervo fibular comum; nervo isquiático"), "correct");
  assert.equal(classifyAnswer(find("p1-89-nervos"), "tibial; femoral; fibular comum; isquiático"), "incomplete");
  assert.equal(classifyAnswer(find("p1-70-meninges"), "pia-máter; aracnoide"), "correct");
  assert.equal(classifyAnswer(find("p1-10-partes"), "corpo do esterno; processo xifoide; manúbrio do esterno"), "correct");
});

test("atlas identifies teeth, costal cartilage and shared-material muscles using real GLB nodes", () => {
  for (const [file, cases] of [
    ["overview-skull-natural", [["Lower canine.r", "Dente Canino Inferior"], ["Upper first molar tooth.r", "Dente Primeiro Molar Superior"]]],
    ["upper-muscles-uncovered-base", [["Deltoid muscle.r", "Músculo deltoide"],
      ["Art cart of radius head​.r", "Cartilagem articular"], ["Pectoralis major.r", "Músculo peitoral maior"]]],
    ["lower-muscles-prepared", [["Gluteus maximus muscle.r", "Músculo glúteo máximo"],
      ["Art cart of patella.r", "Cartilagem articular"]]],
    ["pectoral-back-thorax-bones-costal-cart", [["Costal cart of 1st rib.r", "Cartilagem costal"],
      ["Costal cart of 1st rib.l", "Cartilagem costal"]]],
  ]) {
    const bytes = readFileSync(new URL(`../public/${file}.glb`, import.meta.url));
    const glb = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
    for (const [target, expected] of cases) {
      const node = glb.nodes.find(node => node.name === target && node.mesh !== undefined)
        ?? glb.nodes.find(node => glb.meshes[node.mesh]?.primitives.some(primitive =>
          glb.materials[primitive.material]?.name === target));
      assert(node, `${file}: ${target}`);
      const material = glb.materials[glb.meshes[node.mesh].primitives[0].material].name;
      // Babylon may put the anatomical name on the parent of a primitive mesh.
      assert.equal(boneSelection(material, "primitive", ["primitive", node.name]).name, expected);
    }
  }
  assert.equal(boneSelection("Muscle basic", "unmapped muscle").name, "Músculo (nome não identificado)");
  assert.equal(boneSelection("Articular cartilage", "generic cartilage").name, "Cartilagem articular");
});


test("anatomical review covers every question and every P1 item", () => {
  for (const question of QUESTION_BANK) {
    const notes = anatomyReview(question);
    assert.ok(notes.length > 0, question.id);
    assert.ok(notes.length <= 2, `${question.id}: keep error feedback concise`);
    for (const note of notes) {
      assert.ok(note.title && note.text.length > 100, question.id);
      assert.equal("source" in note, false);
      assert.doesNotMatch(`${note.title} ${note.text}`, /Base:|aula|professor|roteiro|2026|P1/i);
    }
  }
  for (let item = 1; item <= 92; item++) {
    assert.ok(anatomyReview({ p1Items: [item] }).length > 0, `P1 item ${item}`);
  }
  assert.deepEqual(anatomyReview({}), []);
});

test("reviews consolidate sets and retain anatomical distinctions", () => {
  const review = id => anatomyReview(QUESTION_BANK.find(question => question.id === id));
  assert.equal(review("simulado-31").length, 1);
  assert.match(review("simulado-31")[0].text, /Deltoide e redondo maior não/);
  assert.equal(review("simulado-34").length, 1);
  assert.match(review("simulado-34")[0].text, /profundo ao reto femoral/);
  assert.equal(review("simulado-61").length, 1);
  assert.match(review("simulado-61")[0].text, /C1.*C2/);
  assert.match(review("simulado-63")[0].text, /rádio fica lateralmente.*ulna fica medialmente/);
  assert.match(review("simulado-69")[0].text, /dois ramos terminais/);
  assert.equal(anatomyReview({p1Items: [82, 85, 82]}).length, 1);
});
