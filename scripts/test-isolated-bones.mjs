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
  outputText = outputText.replace('import { materialKey } from "./bones";',
    'const materialKey = (name) => name.replace(/\\.\\d+$/, "");');
  outputText = outputText.replace(/from "(@babylonjs[^"\n]+)"/g,
    (_, module) => `from "${import.meta.resolve(module + '.js')}"`);
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const { mirrorRightGroups } = await loadModule("../src/viewer/mirrorRightGroups.ts");
const { createIsolatedBones } = await loadModule("../src/viewer/isolatedBones.ts");

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
    mirrorRightGroups([group], [...meshes, group], meshes);
    assert.equal(meshes.length, 4, "all mirrored pieces must be included");
    const arrange = createIsolatedBones(meshes);
    arrange(["radius"]);
    assert.deepEqual(meshes.filter((mesh) => mesh.isEnabled()), [radius]);
    assert(radius.getBoundingInfo().boundingBox.centerWorld.length() < 0.001);
    arrange(["femur"]);
    assert.deepEqual(meshes.filter((mesh) => mesh.isEnabled()), [femur]);
    assert(femur.getBoundingInfo().boundingBox.centerWorld.length() < 0.001);
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
