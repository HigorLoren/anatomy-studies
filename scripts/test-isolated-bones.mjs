import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";

async function loadModule(file) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  if (outputText.includes('from "../muscles"')) {
    const catalog = ts.transpileModule(readFileSync(new URL("../src/muscles.ts", import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    outputText = outputText.replace('from "../muscles"',
      `from "data:text/javascript;base64,${Buffer.from(catalog).toString("base64")}"`);
  }
  if (outputText.includes('import { visibleSurfaceAnchor } from "./surfaceAnchor";')) {
    const module = await loadModule("../src/viewer/surfaceAnchor.ts");
    globalThis.anatomyTestVisibleSurfaceAnchor = module.visibleSurfaceAnchor;
    outputText = outputText.replace('import { visibleSurfaceAnchor } from "./surfaceAnchor";',
      'const visibleSurfaceAnchor = globalThis.anatomyTestVisibleSurfaceAnchor;');
  }
  if (outputText.includes('import { surfaceNumberRotation } from "./surfaceNumbers";')) {
    const module = await loadModule("../src/viewer/surfaceNumbers.ts");
    globalThis.anatomyTestSurfaceRotation = module.surfaceNumberRotation;
    outputText = outputText.replace('import { surfaceNumberRotation } from "./surfaceNumbers";',
      'const surfaceNumberRotation = globalThis.anatomyTestSurfaceRotation;');
  }
  outputText = outputText.replace('import { materialKey } from "./bones";',
    'const materialKey = (name) => name.replace(/\\.\\d+$/, "");');
  outputText = outputText.replace(/from "(@babylonjs[^"\n]+)"/g,
    (_, module) => `from "${import.meta.resolve(module + '.js')}"`);
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const { mirrorRightGroups } = await loadModule("../src/viewer/mirrorRightGroups.ts");
const { createIsolatedBones } = await loadModule("../src/viewer/isolatedBones.ts");
const { prepareMuscleMeshes, applyMuscleLayer } = await loadModule("../src/viewer/muscleMeshes.ts");

test("muscles sharing textures are selected by anatomical node and all heads stay together", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const shared = new PBRMaterial("Muscle basic", scene);
    const heads = ["Long head of biceps brachii.r", "Short head of biceps brachii.r"]
      .map((name, index) => {
        const node = new TransformNode(name, scene);
        const mesh = CreateBox(`${name}_primitive0`, { size: 1 }, scene);
        mesh.parent = node;
        mesh.position.y = index * 2;
        mesh.material = shared;
        return mesh;
      });
    const other = CreateBox("Infraspinatus muscle.r", { size: 1 }, scene);
    other.material = shared;
    const bone = CreateBox("humerus.r", { size: 1 }, scene);
    bone.material = new PBRMaterial("humerus", scene);
    const deltoid = CreateBox("Deltoid muscle.r", { size: 1 }, scene);
    deltoid.material = shared;
    const fascia = CreateBox("fascia", { size: 1 }, scene);
    fascia.material = new PBRMaterial("Fascia", scene);
    const cutBones = ["Atlas.001", "Axis.001", "Vertebra_C7.001", "Vertebra_L3", "T8", "T9",
      "sternum.001", "Body of sternum.001", "Xiphoid process", "sacrum", "Coccyx",
      "Rib (1st).r", "Rib (12th).r", "Costal cart of 1st.rib.r",
      "10th rib art cart of head.r", "annulus fibrosus C2 C3", "Nucleus pulposus T1-L1",
      "Vertebra L3 art cart.", "art cart of Atlas  C1", "art cart of sacrum lumbosacral joint",
      "Disc", "Disc.001", "Bursae"]
      .map((name) => {
        const mesh = CreateBox(name, { size: 1 }, scene);
        mesh.material = new PBRMaterial(name, scene);
        return mesh;
      });
    const scapula = CreateBox("Scapula.r", { size: 1 }, scene);
    scapula.material = new PBRMaterial("Scapula.001", scene);
    const cartilage = CreateBox("Articular cartilage of glenohumeral joint on scapula.r",
      { size: 1 }, scene);
    cartilage.material = new PBRMaterial("Articular cartilage", scene);
    const meshes = [...heads, other, bone, deltoid, fascia, scapula, cartilage, ...cutBones];
    const originalPositions = meshes.map((mesh) => mesh.position.clone());
    prepareMuscleMeshes("upper-muscles-practice", meshes);
    assert.equal(bone.isDisposed(), false);
    assert(fascia.isDisposed());
    assert(cutBones.every((mesh) => mesh.isDisposed()));
    assert.equal(scapula.isDisposed(), false);
    assert.equal(cartilage.isDisposed(), false);
    assert.equal(shared.name, "Muscle basic");
    assert.equal(heads[0].material, heads[1].material);
    assert.notEqual(heads[0].material, other.material);
    applyMuscleLayer(meshes, true);
    assert(heads.every((mesh) => mesh.isEnabled()));
    assert(other.isEnabled());
    assert(bone.isEnabled());
    assert.equal(deltoid.isEnabled(), false);
    assert.equal(heads[1].position.y - heads[0].position.y, 2);
    applyMuscleLayer(meshes, false);
    assert(deltoid.isEnabled());
    meshes.forEach((mesh, index) => assert(mesh.position.equals(originalPositions[index])));
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

test("deep exposure removes rectus femoris and preserves both heads in the soleus window", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const names = ["Rectus femoris.r", "Vastus intermedius muscle.r", "Soleus muscle.r",
      "Lateral head of gastrocnemius.r", "Medial head of gastrocnemius.r", "Sartorius muscle.r"];
    const meshes = names.map((name) => {
      const mesh = CreateBox(name, { size: 1 }, scene);
      mesh.material = new PBRMaterial("Muscle tile plain", scene);
      return mesh;
    });
    prepareMuscleMeshes("lower-muscles-practice", meshes);
    applyMuscleLayer(meshes, true, "Vastus intermedius");
    assert.equal(meshes[0].isEnabled(), false);
    assert(meshes.slice(1).every((mesh) => mesh.isEnabled()));
    applyMuscleLayer(meshes, true, "Soleus");
    assert(meshes[0].isEnabled());
    assert(meshes[1].isEnabled());
    assert(meshes[2].isEnabled());
    assert(meshes[3].isEnabled());
    assert(meshes[4].isEnabled());
    assert(meshes[5].isEnabled());
    applyMuscleLayer(meshes, false, "Soleus");
    assert(meshes.every((mesh) => mesh.isEnabled()));
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

test("mirrored geometry participates in isolation and only the selected side remains visible", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const group = new TransformNode("limb_right", scene);
    const radius = CreateBox("Radius.r", { size: 1 }, scene);
    radius.material = new PBRMaterial("radius", scene);
    radius.position.y = 20;
    radius.parent = group;
    const femur = CreateBox("Femur.r", { size: 5 }, scene);
    femur.material = new PBRMaterial("femur", scene);
    femur.parent = group;
    const meshes = [radius, femur];
    const nodes = mirrorRightGroups([group], [...meshes, group], meshes);
    assert.equal(meshes.length, 4, "all mirrored pieces must be included");
    const arrange = createIsolatedBones(meshes);
    arrange(["radius"]);
    assert.deepEqual(meshes.filter((mesh) => mesh.isEnabled()), [radius]);
    assert(radius.getBoundingInfo().boundingBox.centerWorld.length() < 0.001);
    arrange(["femur"]);
    assert.deepEqual(meshes.filter((mesh) => mesh.isEnabled()), [femur]);
    assert(femur.getBoundingInfo().boundingBox.centerWorld.length() < 0.001);
    for (const node of nodes) if (!node.isDisposed()) node.dispose();
    assert.equal(scene.meshes.length, 0,
      "switching models disposes mirrored meshes even after isolation detached them");
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

test("hint preserves anatomical spacing and can return to the isolated piece", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const radius = CreateBox("Radius.r", { size: 1 }, scene);
    radius.material = new PBRMaterial("radius", scene);
    radius.position.set(8, 20, 3);
    const ulna = CreateBox("Ulna.r", { size: 1 }, scene);
    ulna.material = new PBRMaterial("ulna", scene);
    ulna.position.set(10, 21, 3);
    const spacing = ulna.position.subtract(radius.position);
    const arrange = createIsolatedBones([radius, ulna]);
    arrange(["radius"]);
    assert.equal(ulna.isEnabled(), false);
    arrange(["radius", "ulna"], true);
    assert.equal(ulna.isEnabled(), true);
    assert(ulna.position.subtract(radius.position).equalsWithEpsilon(spacing));
    arrange(["radius"]);
    assert.equal(ulna.isEnabled(), false);
    assert(radius.getBoundingInfo().boundingBox.centerWorld.length() < 0.001);
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

const { visibleSurfaceAnchor } = await loadModule("../src/viewer/surfaceAnchor.ts");
const { practiceView } = await loadModule("../src/viewer/practiceView.ts");
const { ArcRotateCamera } = await import("@babylonjs/core/Cameras/arcRotateCamera.js");
const { Vector3 } = await import("@babylonjs/core/Maths/math.vector.js");
const { createMusclePins } = await loadModule("../src/viewer/musclePins.ts");

test("muscle pins stay on the same surface through orbit and answer updates", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
      10, Vector3.Zero(), scene);
    const muscle = CreateBox("muscle", { size: 2 }, scene);
    muscle.material = new PBRMaterial("Teres minor", scene);
    const pins = createMusclePins(scene, camera);
    pins.configure(["Teres minor"]);
    const original = pins.point("Teres minor").clone();
    const normal = pins.surface("Teres minor").normal.clone();
    assert(normal.equalsWithEpsilon(Vector3.Forward()), "surface normal faces outward");
    assert(Math.abs(original.z - 1) < 0.001, "pin must touch the muscle face");
    camera.alpha = Math.PI / 4;
    camera.getViewMatrix(true);
    assert(pins.point("Teres minor").equalsWithEpsilon(original));
    pins.configure(["Teres minor"]);
    assert(pins.point("Teres minor").equalsWithEpsilon(original));
    camera.alpha = -Math.PI / 2;
    camera.getViewMatrix(true);
    assert(pins.point("Teres minor").equalsWithEpsilon(original),
      "surface anchor stays fixed behind its muscle");
    camera.alpha = Math.PI / 2;
    camera.getViewMatrix(true);
    assert(pins.point("Teres minor").equalsWithEpsilon(original));
    const cover = CreateBox("cover", { size: 2 }, scene);
    cover.position.z = 3;
    cover.computeWorldMatrix(true);
    pins.configure(["Teres minor"]);
    assert(pins.point("Teres minor").equalsWithEpsilon(original),
      "covering pieces cannot relocate the surface anchor");
    assert(pins.surface("Teres minor").normal.equalsWithEpsilon(normal));
    muscle.rotation.y = Math.PI / 2;
    assert(pins.surface("Teres minor").normal.equalsWithEpsilon(Vector3.Right()),
      "number orientation follows the muscle face");
    muscle.setEnabled(false);
    assert.equal(pins.point("Teres minor"), undefined, "removed muscles have no number");
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

test("muscle identification starts from a view where the requested target is exposed", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
      10, Vector3.Zero(), scene);
    const target = CreateBox("Teres minor muscle.r", { size: 2 }, scene);
    target.material = new PBRMaterial("Teres minor", scene);
    target.metadata = { muscleTarget: true };
    const cover = CreateBox("cover", { width: 4, height: 4, depth: 0.3 }, scene);
    cover.position.z = 3;
    target.computeWorldMatrix(true);
    cover.computeWorldMatrix(true);
    assert.equal(visibleSurfaceAnchor(scene, target, camera), undefined);
    practiceView(camera, scene, { muscleTarget: "Teres minor", exposeDeepMuscles: true });
    assert(visibleSurfaceAnchor(scene, target, camera));
    assert.equal(target.isEnabled(), true);
    assert.equal(cover.isEnabled(), true, "camera orientation preserves the surrounding anatomy");
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

test("clay anchor uses a visible external surface and rejects a covered bone", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
      10, Vector3.Zero(), scene);
    const target = CreateBox("target", { size: 2 }, scene);
    target.material = new PBRMaterial("target", scene);
    scene.render();
    const surface = visibleSurfaceAnchor(scene, target, camera);
    assert(surface);
    assert(surface.point.z > 0.99);
    assert(surface.normal.z > 0);
    const cover = CreateBox("cover", { size: 4 }, scene);
    cover.material = new PBRMaterial("cover", scene);
    cover.position.z = 3;
    cover.computeWorldMatrix(true);
    assert.equal(visibleSurfaceAnchor(scene, target, camera), undefined);
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

test("single-piece initial view rotates at eye level and skull lateral targets face the camera", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4,
      10, Vector3.Zero(), scene);
    practiceView(camera, scene, { isolatedBones: ["humerus"], clayTarget: "humerus" });
    assert.equal(camera.beta, Math.PI / 2);
    const temporal = CreateBox("Temporal.r", { size: 1 }, scene);
    temporal.material = new PBRMaterial("Temporal bone.r", scene);
    temporal.position.x = -2;
    practiceView(camera, scene, { clayTarget: "Temporal bone" });
    assert(camera.alpha > Math.PI / 2);
    assert.equal(camera.beta, Math.PI / 2);
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

const { rotateTrackball, trackballPoint, attachTrackball, usesTrackball } =
  await loadModule("../src/viewer/trackball.ts");

test("trackball combines axes, permits diagonal tilt, and preserves pivot and distance", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const center = new Vector3(2, 3, 4);
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, 10, center, scene);
    const initial = camera.position.clone();
    rotateTrackball(camera, trackballPoint(300, 100, 400, 400),
      trackballPoint(100, 100, 400, 400));
    camera.getViewMatrix(true);
    assert(!camera.upVector.equalsWithEpsilon(Vector3.Up()), "rotation must allow tilt");
    assert(!camera.position.equalsWithEpsilon(initial));
    assert(camera.target.equalsWithEpsilon(center));
    assert(Math.abs(camera.position.subtract(center).length() - 10) < 0.001);
    assert(Math.abs(camera.upVector.length() - 1) < 0.001);
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

test("one touch rotates freely, two touches leave rotation to pinch and pan, and cleanup works", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
      10, Vector3.Zero(), scene);
    const listeners = new Map();
    const canvas = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
      addEventListener: (name, listener) => listeners.set(name, listener),
      removeEventListener: (name) => listeners.delete(name),
    };
    const controls = attachTrackball(canvas, camera);
    controls.setExercise({ clayTarget: "humerus", isolatedBones: ["humerus"] });
    const event = (pointerId, x, y) => ({ pointerId, clientX: x, clientY: y, pointerType: "touch" });
    listeners.get("pointerdown")(event(1, 300, 100));
    listeners.get("pointermove")(event(1, 100, 100));
    assert(!camera.upVector.equalsWithEpsilon(Vector3.Up()));
    const position = camera.position.clone();
    listeners.get("pointerdown")(event(2, 250, 200));
    listeners.get("pointermove")(event(1, 150, 150));
    assert(camera.position.equalsWithEpsilon(position));
    controls.dispose();
    assert.equal(listeners.size, 0);
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

test("trackball uses the original drag direction for horizontal and vertical movements", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
      10, Vector3.Zero(), scene);
    rotateTrackball(camera, trackballPoint(200, 200, 400, 400),
      trackballPoint(250, 200, 400, 400));
    assert(camera.position.x > 0);
    camera.upVector = Vector3.Up();
    camera.setPosition(new Vector3(0, 0, 10));
    rotateTrackball(camera, trackballPoint(200, 200, 400, 400),
      trackballPoint(200, 150, 400, 400));
    assert(camera.position.y > 0);
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

test("free rotation is limited to humerus, ulna, radius and fibula naming exercises", () => {
  for (const bone of ["humerus", "ulna", "radius", "Fibula"]) {
    assert.equal(usesTrackball({ clayTarget: bone, isolatedBones: [bone] }), true);
    assert.equal(usesTrackball({ clayTarget: bone, isolatedBones: [bone, "Tibia"],
      preserveLayout: true }), true);
  }
  for (const bone of ["Atlas", "Axis", "femur", "Tibia", "Patella", "Mandible bone"]) {
    assert.equal(usesTrackball({ clayTarget: bone, isolatedBones: [bone] }), false);
  }
  assert.equal(usesTrackball(null), false);
  assert.equal(usesTrackball({ clayTarget: "radius" }), false);
  assert.equal(usesTrackball({ markers: ["radius"], isolatedBones: ["radius"] }), false);
});

test("switching away from a special bone restores the original camera controls", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
      10, Vector3.Zero(), scene);
    camera.angularSensibilityX = 900;
    camera.angularSensibilityY = 1100;
    const canvas = { addEventListener() {}, removeEventListener() {} };
    const controls = attachTrackball(canvas, camera);
    assert.equal(camera.angularSensibilityX, 900);
    controls.setExercise({ clayTarget: "humerus", isolatedBones: ["humerus"] });
    assert.equal(camera.angularSensibilityX, Infinity);
    controls.setExercise({ clayTarget: "Atlas", isolatedBones: ["Atlas"] });
    assert.equal(camera.angularSensibilityX, 900);
    assert.equal(camera.angularSensibilityY, 1100);
    assert(camera.upVector.equalsWithEpsilon(Vector3.Up()));
    controls.dispose();
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

const { surfaceNumberRotation } = await loadModule("../src/viewer/surfaceNumbers.ts");
const { Matrix } = await import("@babylonjs/core/Maths/math.vector.js");
test("number plates face outward along the muscle normal, including near vertical faces", () => {
  for (const normal of [Vector3.Forward(), Vector3.Right(), Vector3.Up(),
    new Vector3(1, 2, 3).normalize()]) {
    const rotation = Matrix.Identity();
    surfaceNumberRotation(normal).toRotationMatrix(rotation);
    const plateFront = Vector3.TransformNormal(new Vector3(0, 0, -1), rotation);
    assert(plateFront.equalsWithEpsilon(normal), "front face must point away from the muscle");
  }
});

const { preparedMuscleFile } = await loadModule("../src/muscles.ts");
test("muscle questions choose exported GLBs for their prepared and restored layers", () => {
  assert.equal(preparedMuscleFile("upper-muscles-practice", "Supraspinatus"),
    "upper-muscles-prepared");
  assert.equal(preparedMuscleFile("upper-muscles-practice", "Supraspinatus", false),
    "upper-muscles-uncovered-base");
  assert.equal(preparedMuscleFile("lower-muscles-practice", "Vastus intermedius"),
    "lower-muscles-vastus-intermedius");
  assert.equal(preparedMuscleFile("lower-muscles-practice", "Soleus"), "lower-muscles-soleus");
  assert.equal(preparedMuscleFile("lower-muscles-practice", "Soleus", false),
    "lower-muscles-prepared");
  assert.equal(preparedMuscleFile("lower-muscles-practice", "Vastus lateralis"),
    "lower-muscles-prepared");
});

test("muscle numbers choose an exposed face when the initial side is covered", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
      10, Vector3.Zero(), scene);
    const muscle = CreateBox("muscle", { size: 2 }, scene);
    muscle.material = new PBRMaterial("Supraspinatus", scene);
    const cover = CreateBox("cover", { width: 8, height: 8, depth: 0.5 }, scene);
    cover.position.z = 3;
    cover.computeWorldMatrix(true);
    const pins = createMusclePins(scene, camera);
    pins.configure(["Supraspinatus"], 1);
    const surface = pins.surface("Supraspinatus");
    assert(surface, "an exposed face must be found by looking beyond the initial view");
    assert(surface.normal.z < 0.5, "the number must not be placed facing the covering piece");
    const point = surface.point.clone();
    camera.alpha += Math.PI;
    camera.getViewMatrix(true);
    assert(pins.point("Supraspinatus").equalsWithEpsilon(point),
      "the chosen exposed face stays fixed during rotation");
  } finally {
    scene.dispose(); engine.dispose();
  }
});

test("numbers shrink to fit narrow exposed muscle faces", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
      10, Vector3.Zero(), scene);
    const muscle = CreateBox("narrow muscle", { width: 0.035, height: 0.2, depth: 0.035 }, scene);
    muscle.material = new PBRMaterial("Supraspinatus", scene);
    const pins = createMusclePins(scene, camera);
    pins.configure(["Supraspinatus"], 1);
    assert.equal(pins.surface("Supraspinatus").sizeScale, 0.4,
      "the number circle must fit the exposed surface instead of being cut off");
  } finally {
    scene.dispose(); engine.dispose();
  }
});

const { createMuscleFocus } = await loadModule("../src/viewer/muscleFocus.ts");
const { PointerEventTypes } = await import("@babylonjs/core/Events/pointerEvents.js");
test("number selection smoothly centers all muscle heads and faces the fixed marker", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
    10, Vector3.Zero(), scene);
  for (const x of [4, 6]) {
    const head = CreateBox(`head-${x}`, { size: 2 }, scene);
    head.position.x = x;
    head.material = new PBRMaterial("Biceps brachii", scene);
  }
  const anchor = { point: new Vector3(4, 0, -1), normal: Vector3.Backward() };
  const focus = createMuscleFocus(scene, camera, () => anchor);
  const exercise = { muscleTarget: "Biceps brachii", highlight: "Biceps brachii" };
  try {
    focus.configure(exercise);
    assert(camera.target.equalsWithEpsilon(Vector3.Zero()), "selection starts without a jump");
    focus.update(275);
    assert(Math.abs(camera.target.x - 2.5) < 0.001, "the view moves progressively");
    focus.update(275);
    assert(camera.target.equalsWithEpsilon(new Vector3(5, 0, 0)), "all muscle heads are framed");
    camera.getViewMatrix(true);
    assert(Vector3.Dot(camera.position.subtract(anchor.point), anchor.normal) > 0,
      "the camera ends on the exposed side of the number");
    assert(scene.meshes.every(mesh => mesh.isEnabled()), "neighboring anatomy is retained");
    const radius = camera.radius;
    camera.alpha += 0.4;
    const manualAlpha = camera.alpha;
    focus.configure({ ...exercise, highlightColor: "red" });
    focus.update(1000);
    assert.equal(camera.alpha, manualAlpha, "feedback changes do not undo manual rotation");
    focus.refresh(exercise);
    focus.update(550);
    assert.notEqual(camera.alpha, manualAlpha, "selecting the number again refocuses it");
    assert.equal(camera.radius, radius);
  } finally {
    focus.dispose(); scene.dispose(); engine.dispose();
  }
});

test("manual dragging cancels muscle focus and bone questions keep their view", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const camera = new ArcRotateCamera("camera", 0, Math.PI / 2, 10, Vector3.Zero(), scene);
  const mesh = CreateBox("muscle", { size: 2 }, scene);
  mesh.position.x = 4;
  mesh.material = new PBRMaterial("Teres minor", scene);
  const focus = createMuscleFocus(scene, camera,
    () => ({ point: new Vector3(4, 0, 1), normal: Vector3.Forward() }));
  try {
    focus.configure({ muscleTarget: "Teres minor", highlight: "Teres minor" });
    focus.update(100);
    scene.onPointerObservable.notifyObservers({ type: PointerEventTypes.POINTERDOWN });
    const stopped = camera.target.clone();
    focus.update(1000);
    assert(camera.target.equalsWithEpsilon(stopped), "touch/drag takes control immediately");
    focus.configure({ highlight: "Teres minor", isolatedBones: ["humerus"] });
    focus.update(1000);
    assert(camera.target.equalsWithEpsilon(stopped), "bone questions do not activate muscle focus");
  } finally {
    focus.dispose(); scene.dispose(); engine.dispose();
  }
});

const { createMuscleFlag } = await loadModule("../src/viewer/muscleFlag.ts");
test("muscle naming uses a small flag pinned to the surface and disposes its resources", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const anchor = new Vector3(2, 3, 4);
    const clear = createMuscleFlag(scene, anchor, 10, Vector3.Right(), 0.2);
    const root = scene.getTransformNodeByName("practice-muscle-flag");
    assert(root.position.equalsWithEpsilon(anchor));
    const pole = scene.getMeshByName("practice-flag-pole");
    pole.computeWorldMatrix(true);
    const center = pole.getBoundingInfo().boundingBox.centerWorld;
    assert(center.x > anchor.x,
      "the pole extends outward from the marked muscle face");
    assert(pole.getBoundingInfo().boundingBox.extendSizeWorld.length() < 0.02,
      "flag size follows the muscle rather than the entire limb");
    assert(scene.meshes.every(mesh => mesh.metadata.practiceMarker && !mesh.isPickable));
    clear();
    assert.equal(scene.meshes.length, 0);
    assert.equal(scene.materials.length, 0);
  } finally {
    scene.dispose(); engine.dispose();
  }
});
