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
  ["lower-limb", "lower-muscles-soleus", /head of gastrocnemius/],
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
