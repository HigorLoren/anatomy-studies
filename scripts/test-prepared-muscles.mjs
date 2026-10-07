import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import vm from "node:vm";
import { test } from "node:test";

function readGlb(name) {
  const file = readFileSync(new URL(`../public/${name}.glb`, import.meta.url));
  assert.equal(file.readUInt32LE(0), 0x46546c67);
  assert.equal(file.readUInt32LE(4), 2);
  assert.equal(file.readUInt32LE(8), file.length);
  const length = file.readUInt32LE(12);
  const doc = JSON.parse(file.subarray(20, 20 + length));
  return { doc, binary: file.subarray(28 + length) };
}
const variants = [
  ["upper-limb", "upper-muscles-prepared", /Deltoid|Trapezius|Pectoralis|Latissimus|Serratus/],
  ["upper-limb", "upper-muscles-uncovered-base", /^$/],
  ["lower-limb", "lower-muscles-prepared", /^$/],
  ["lower-limb", "lower-muscles-vastus-intermedius", /Rectus femoris/],
  ["lower-limb", "lower-muscles-soleus", /^$/],
];
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const require = createRequire(import.meta.url);
const decoderPath = require.resolve("@babylonjs/core/assets/Draco/draco_decoder_gltf.js");
const context = { module: { exports: {} }, exports: {}, require, __filename: decoderPath,
  __dirname: dirname(decoderPath), console, process, Buffer, setTimeout, clearTimeout };
vm.runInNewContext(readFileSync(decoderPath, "utf8"), context);
const draco = await context.module.exports();
const decodedHashes = new Set();

for (const [originalName, preparedName, covers] of variants) {
  test(`${preparedName} preserves source geometry and textures without removed pieces or numbers`, () => {
    const source = readGlb(originalName);
    const { doc, binary } = readGlb(preparedName);
    assert(doc.meshes.length > 100 && doc.meshes.length < source.doc.meshes.length);
    assert(binary.length < source.binary.length / 2, "unused geometry and textures are pruned");
    const nodes = doc.nodes.map(node => node.name ?? "");
    assert(!nodes.some(name => covers.test(name)), "covering pieces must be physically absent");
    assert(!doc.materials.some(material => /^sacrum(?:\.\d+)?$/.test(material.name)),
      "sacrum must be physically absent from every muscle view");
    assert(!nodes.some(name => /(?:art cart|articular cartilage).*on sacrum/i.test(name)),
      "cartilage on removed sacrum must also be absent");
    if (originalName === "upper-limb") {
      assert(!doc.materials.some(material => /^clavicle(?:\.\d+)?$/.test(material.name)),
        "clavicle must be absent from prepared and covered upper muscle views");
      assert(!nodes.some(name => /(?:art cart|articular cartilage).*clavicle/i.test(name)),
        "cartilage on removed clavicle must also be absent");
      assert(doc.materials.some(material => /^Scapula(?:\.\d+)?$/.test(material.name)));
    } else {
      assert(doc.materials.some(material => /^Hip bone(?:\.\d+)?$/.test(material.name)),
        "hip bones must remain as references");
    }
    assert(!nodes.some(name => /practice-number|practiceMarker|practice-blue-clay/.test(name)));
    assert(!doc.materials.some(material => /^(Bursae|Disc)(\.\d+)?$/.test(material.name)));
    assert(nodes.some(name => /Supraspinatus/.test(name) || /Soleus/.test(name)));
    const originals = new Map(source.doc.nodes.map(node => [node.name, node]));
    for (const node of doc.nodes) {
      const original = originals.get(node.name);
      for (const key of ["matrix", "translation", "rotation", "scale"]) {
        assert.deepEqual(node[key], original[key], "anatomical transform must be unchanged");
      }
      if (node.mesh !== undefined) assert(doc.meshes[node.mesh]);
      node.children?.forEach(index => assert(doc.nodes[index]));
    }
    const sourceChunks = new Set(source.doc.bufferViews.map(view =>
      hash(source.binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength))));
    for (const view of doc.bufferViews) {
      assert.equal(view.buffer, 0);
      assert.equal(view.byteOffset % 4, 0);
      assert(view.byteOffset + view.byteLength <= doc.buffers[0].byteLength);
      assert(sourceChunks.has(hash(binary.subarray(view.byteOffset, view.byteOffset + view.byteLength))),
        "compressed geometry and embedded images must retain their original bytes");
    }
    for (const image of doc.images) assert(doc.bufferViews[image.bufferView]);
    for (const texture of doc.textures) assert(doc.images[texture.source]);
    for (const mesh of doc.meshes) for (const primitive of mesh.primitives) {
      assert(doc.materials[primitive.material]);
      Object.values(primitive.attributes).forEach(index => assert(doc.accessors[index]));
      assert(doc.accessors[primitive.indices]);
      const ext = primitive.extensions.KHR_draco_mesh_compression;
      const view = doc.bufferViews[ext.bufferView];
      const bytes = binary.subarray(view.byteOffset, view.byteOffset + view.byteLength);
      if (decodedHashes.has(hash(bytes))) continue;
      const buffer = new draco.DecoderBuffer();
      const decoder = new draco.Decoder();
      const decoded = new draco.Mesh();
      buffer.Init(bytes, bytes.length);
      const status = decoder.DecodeBufferToMesh(buffer, decoded);
      assert(status.ok(), status.error_msg());
      assert(decoded.num_points() > 0 && decoded.num_faces() > 0);
      decodedHashes.add(hash(bytes));
      for (const item of [status, decoded, decoder, buffer]) draco.destroy(item);
    }
  });
}

async function runtimeModule(path) {
  const ts = (await import("typescript")).default;
  let code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const catalog = ts.transpileModule(readFileSync(new URL("../src/muscles.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  code = code.replace('from "../muscles"',
    `from "data:text/javascript;base64,${Buffer.from(catalog).toString("base64")}"`)
    .replace('import { materialKey } from "./bones";',
      'const materialKey = name => name.replace(/\\.\\d+$/, "");')
    .replace(/from "(@babylonjs[^"\n]+)"/g,
      (_, name) => `from "${import.meta.resolve(name + '.js')}"`);
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}

function decodeGeometry(doc, binary, primitive) {
  const ext = primitive.extensions.KHR_draco_mesh_compression;
  const view = doc.bufferViews[ext.bufferView];
  const bytes = binary.subarray(view.byteOffset, view.byteOffset + view.byteLength);
  const buffer = new draco.DecoderBuffer();
  const decoder = new draco.Decoder();
  const decoded = new draco.Mesh();
  buffer.Init(bytes, bytes.length);
  const status = decoder.DecodeBufferToMesh(buffer, decoded);
  assert(status.ok());
  const result = {};
  for (const [semantic, key] of [["POSITION", "positions"], ["NORMAL", "normals"]]) {
    const attribute = decoder.GetAttributeByUniqueId(decoded, ext.attributes[semantic]);
    const values = new draco.DracoFloat32Array();
    decoder.GetAttributeFloatForAllPoints(decoded, attribute, values);
    result[key] = Array.from({ length: values.size() }, (_, index) => values.GetValue(index));
    draco.destroy(values);
  }
  const face = new draco.DracoInt32Array();
  result.indices = [];
  for (let index = 0; index < decoded.num_faces(); index++) {
    decoder.GetFaceFromMesh(decoded, index, face);
    result.indices.push(face.GetValue(0), face.GetValue(1), face.GetValue(2));
  }
  for (const item of [face, status, decoded, decoder, buffer]) draco.destroy(item);
  return result;
}

test("real soleus piece opens a posterior window, exposes all six pins and restores head geometry", async () => {
  const { NullEngine } = await import("@babylonjs/core/Engines/nullEngine.js");
  const { Scene } = await import("@babylonjs/core/scene.js");
  const { Mesh } = await import("@babylonjs/core/Meshes/mesh.js");
  const { VertexData } = await import("@babylonjs/core/Meshes/mesh.vertexData.js");
  const { TransformNode } = await import("@babylonjs/core/Meshes/transformNode.js");
  const { PBRMaterial } = await import("@babylonjs/core/Materials/PBR/pbrMaterial.js");
  const { ArcRotateCamera } = await import("@babylonjs/core/Cameras/arcRotateCamera.js");
  const { Vector3 } = await import("@babylonjs/core/Maths/math.vector.js");
  const { Ray } = await import("@babylonjs/core/Culling/ray.js");
  const { applyMuscleLayer, prepareMuscleMeshes } = await runtimeModule("../src/viewer/muscleMeshes.ts");
  const { createMusclePins } = await runtimeModule("../src/viewer/musclePins.ts");
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const { doc, binary } = readGlb("lower-muscles-soleus");
    const root = new TransformNode("glTF-root", scene);
    root.scaling.z = -1;
    for (const node of doc.nodes.filter(node => node.mesh !== undefined)) {
      const primitive = doc.meshes[node.mesh].primitives[0];
      const mesh = new Mesh(node.name, scene);
      const data = Object.assign(new VertexData(), decodeGeometry(doc, binary, primitive));
      data.applyToMesh(mesh);
      mesh.parent = root;
      mesh.material = new PBRMaterial(doc.materials[primitive.material].name, scene);
    }
    prepareMuscleMeshes("lower-muscles-practice", scene.meshes);
    const heads = scene.meshes.filter(mesh => /head of gastrocnemius/.test(mesh.name));
    assert.equal(heads.length, 2);
    const originals = heads.map(mesh => Array.from(mesh.getVerticesData("position")));
    applyMuscleLayer(scene.meshes, true, "Soleus");
    assert(heads.every(mesh => mesh.isEnabled()));
    const opened = heads.map(mesh => Array.from(mesh.getVerticesData("position")));
    opened.forEach((positions, index) => assert.notDeepEqual(positions, originals[index]));
    applyMuscleLayer(scene.meshes, true, "Soleus");
    heads.forEach((mesh, index) => assert.deepEqual(Array.from(mesh.getVerticesData("position")), opened[index]));
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, 0.7,
      new Vector3(-0.08, 0.27, 0.05), scene);
    const pins = createMusclePins(scene, camera);
    const keys = ["Soleus", "Gastrocnemius", "Tibialis anterior", "Fibularis longus",
      "Fibularis brevis", "Extensor digitorum longus"];
    pins.configure(keys, 0.24);
    for (const key of keys) assert(pins.surface(key), `${key} needs an exposed pin`);
    const soleus = scene.meshes.find(mesh => mesh.material?.name === "Soleus");
    const pin = pins.surface("Soleus");
    assert(pin.normal.z > 0.5, "soleus marker must face the posterior opening");
    const hit = scene.pickWithRay(new Ray(pin.point.add(new Vector3(0, 0, 0.5)),
      new Vector3(0, 0, -1)), mesh => mesh.isEnabled() && mesh.getTotalVertices() > 0);
    assert.equal(hit.pickedMesh, soleus, "gastrocnemius must not cover the soleus marker");
    assert(Math.abs(pin.point.x - soleus.metadata.soleusWindow.center.x) < 0.01);
    applyMuscleLayer(scene.meshes, false, "Soleus");
    heads.forEach((mesh, index) => assert.deepEqual(Array.from(mesh.getVerticesData("position")), originals[index]));
    assert.equal(soleus.metadata.soleusWindow, undefined);
  } finally {
    scene.dispose(); engine.dispose();
  }
});
