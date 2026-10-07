// Export the prepared anatomical pieces without question markers.
// Run: node scripts/bake-muscle-pieces.mjs
import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";

function transpile(path) {
  return ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}
const catalog = await import(`data:text/javascript;base64,${Buffer.from(transpile("src/muscles.ts")).toString("base64")}`);
let rules = transpile("src/viewer/muscleMeshes.ts")
  .replace('from "../muscles"', `from "data:text/javascript;base64,${Buffer.from(transpile("src/muscles.ts")).toString("base64")}"`)
  .replace('import { materialKey } from "./bones";', 'const materialKey = name => name.replace(/\\.\\d+$/, "");')
  .replace(/from "(@babylonjs[^"\n]+)"/g, (_, name) => `from "${import.meta.resolve(name + '.js')}"`);
const { isStudyObstruction } = await import(`data:text/javascript;base64,${Buffer.from(rules).toString("base64")}`);

const variants = [
  ["upper-limb", "upper-muscles-prepared", "upper-muscles-practice", "Supraspinatus"],
  ["upper-limb", "upper-muscles-uncovered-base", "upper-muscles-practice", ""],
  ["lower-limb", "lower-muscles-prepared", "lower-muscles-practice", ""],
  ["lower-limb", "lower-muscles-vastus-intermedius", "lower-muscles-practice", "Vastus intermedius"],
  ["lower-limb", "lower-muscles-soleus", "lower-muscles-practice", "Soleus"],
];
for (const [source, output, model, target] of variants) {
  const { doc, binary } = readGlb(`public/${source}.glb`);
  const covers = catalog.muscleExposure(target);
  prepare(doc, model, covers);
  const packed = compact(doc, binary);
  writeGlb(`public/${output}.glb`, doc, packed);
  console.log(`${output}.glb: ${doc.meshes.length} meshes, ${doc.materials.length} materials, ${(packed.length / 1048576).toFixed(2)} MiB`);
}

function readGlb(path) {
  const data = readFileSync(path);
  if (data.readUInt32LE(0) !== 0x46546c67) throw new Error("Expected GLB");
  const length = data.readUInt32LE(12);
  return { doc: JSON.parse(data.subarray(20, 20 + length).toString()),
    binary: data.subarray(28 + length) };
}

function prepare(doc, model, covers) {
  if (doc.skins?.length || doc.animations?.length) throw new Error("Animated GLBs require a separate exporter");
  const parent = new Map();
  doc.nodes.forEach((node, index) => node.children?.forEach(child => parent.set(child, index)));
  const meshes = [];
  doc.nodes.forEach((node, index) => {
    if (node.mesh === undefined) return;
    const names = [];
    for (let current = index; current !== undefined; current = parent.get(current)) {
      names.push((doc.nodes[current].name ?? "").replace(/\.\d+$/, "").replace(/[._][lr]$/, ""));
    }
    const mesh = structuredClone(doc.meshes[node.mesh]);
    mesh.primitives = mesh.primitives.filter(primitive => {
      const material = doc.materials[primitive.material]?.name ?? "";
      return !isStudyObstruction(model, material, names) && !names.some(name => covers.includes(name));
    });
    delete node.mesh;
    if (mesh.primitives.length) { node.mesh = meshes.length; meshes.push(mesh); }
  });
  doc.meshes = meshes;
  const kept = new Set();
  doc.nodes.forEach((node, index) => {
    if (node.mesh === undefined) return;
    for (let current = index; current !== undefined; current = parent.get(current)) kept.add(current);
  });
  const map = remap(doc, "nodes", kept);
  doc.nodes.forEach(node => {
    if (node.children) node.children = node.children.filter(index => kept.has(index)).map(index => map.get(index));
  });
  doc.scenes.forEach(scene => { scene.nodes = scene.nodes.filter(index => kept.has(index)).map(index => map.get(index)); });
  doc.asset.generator = "Anatomia prepared muscle piece exporter";
}

function remap(doc, key, used) {
  const mapping = new Map();
  doc[key] = (doc[key] ?? []).filter((_, index) => {
    if (!used.has(index)) return false;
    mapping.set(index, mapping.size);
    return true;
  });
  return mapping;
}

function textureInfos(object, callback) {
  for (const [key, value] of Object.entries(object)) {
    if (!value || typeof value !== "object") continue;
    if (/Texture$/.test(key) && typeof value.index === "number") callback(value);
    else textureInfos(value, callback);
  }
}

function compact(doc, binary) {
  const primitives = doc.meshes.flatMap(mesh => mesh.primitives);
  const materials = remap(doc, "materials", new Set(primitives.map(item => item.material)));
  primitives.forEach(item => { item.material = materials.get(item.material); });
  const usedTextures = new Set();
  doc.materials.forEach(material => textureInfos(material, info => usedTextures.add(info.index)));
  const textures = remap(doc, "textures", usedTextures);
  doc.materials.forEach(material => textureInfos(material, info => { info.index = textures.get(info.index); }));
  const images = remap(doc, "images", new Set(doc.textures.map(texture => texture.source)));
  doc.textures.forEach(texture => { texture.source = images.get(texture.source); });
  const samplers = remap(doc, "samplers", new Set(doc.textures.map(texture => texture.sampler)));
  doc.textures.forEach(texture => {
    if (texture.sampler !== undefined) texture.sampler = samplers.get(texture.sampler);
  });
  const usedAccessors = new Set();
  primitives.forEach(item => {
    Object.values(item.attributes).forEach(index => usedAccessors.add(index));
    if (item.indices !== undefined) usedAccessors.add(item.indices);
    if (item.targets?.length) throw new Error("Morph targets require a separate exporter");
  });
  const accessors = remap(doc, "accessors", usedAccessors);
  primitives.forEach(item => {
    for (const key of Object.keys(item.attributes)) item.attributes[key] = accessors.get(item.attributes[key]);
    if (item.indices !== undefined) item.indices = accessors.get(item.indices);
  });
  const references = [];
  doc.accessors.forEach(accessor => {
    if (accessor.sparse) throw new Error("Sparse accessors require a separate exporter");
    if (accessor.bufferView !== undefined) references.push(accessor);
  });
  doc.images.forEach(image => {
    if (image.uri) throw new Error("Expected embedded images");
    references.push(image);
  });
  primitives.forEach(item => {
    const draco = item.extensions?.KHR_draco_mesh_compression;
    if (draco) references.push(draco);
  });
  const views = remap(doc, "bufferViews", new Set(references.map(item => item.bufferView)));
  references.forEach(item => { item.bufferView = views.get(item.bufferView); });
  let length = 0;
  const chunks = [];
  for (const view of doc.bufferViews) {
    const padding = (4 - length % 4) % 4;
    chunks.push(Buffer.alloc(padding)); length += padding;
    chunks.push(binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength));
    view.byteOffset = length; view.buffer = 0; length += view.byteLength;
  }
  doc.buffers = [{ byteLength: length }];
  return Buffer.concat(chunks);
}

function writeGlb(path, doc, binary) {
  const json = Buffer.from(JSON.stringify(doc));
  const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  const paddedBinary = Buffer.concat([binary, Buffer.alloc((4 - binary.length % 4) % 4)]);
  const output = Buffer.alloc(28 + paddedJson.length + paddedBinary.length);
  [0x46546c67, 2, output.length, paddedJson.length, 0x4e4f534a].forEach((value, i) => output.writeUInt32LE(value, i * 4));
  paddedJson.copy(output, 20);
  output.writeUInt32LE(paddedBinary.length, 20 + paddedJson.length);
  output.writeUInt32LE(0x004e4942, 24 + paddedJson.length);
  paddedBinary.copy(output, 28 + paddedJson.length);
  writeFileSync(path, output);
}
