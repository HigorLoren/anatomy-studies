// Local Draco decoder used only by the offline texture bake.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = path.resolve('node_modules/@babylonjs/core/assets/Draco/draco_decoder_gltf.js');
const context = { module: { exports: {} }, exports: {}, require, __filename: source, __dirname: path.dirname(source), console, process, Buffer, setTimeout, clearTimeout };
vm.runInNewContext(fs.readFileSync(source, 'utf8'), context);
(async () => {
  const draco = await context.module.exports();
  const file = fs.readFileSync('public/overview-skull.glb');
  const length = file.readUInt32LE(12);
  const doc = JSON.parse(file.subarray(20, 20 + length));
  const bin = file.subarray(28 + length);
  const meshes = doc.meshes.map(mesh => {
    const primitive = mesh.primitives[0];
    const ext = primitive.extensions.KHR_draco_mesh_compression;
    const view = doc.bufferViews[ext.bufferView];
    const buffer = new draco.DecoderBuffer();
    const bytes = bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    buffer.Init(bytes, bytes.length);
    const decoder = new draco.Decoder();
    const decoded = new draco.Mesh();
    const status = decoder.DecodeBufferToMesh(buffer, decoded);
    if (!status.ok()) throw new Error(status.error_msg());
    const read = (name, width) => {
      const attr = decoder.GetAttributeByUniqueId(decoded, ext.attributes[name]);
      const values = new draco.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(decoded, attr, values);
      const out = Array.from({ length: decoded.num_points() }, (_, i) => Array.from({ length: width }, (_, j) => values.GetValue(i * width + j)));
      draco.destroy(values);
      return out;
    };
    const positions = read('POSITION', 3), uv = read('TEXCOORD_0', 2);
    const face = new draco.DracoInt32Array();
    const triangles = Array.from({ length: decoded.num_faces() }, (_, i) => {
      decoder.GetFaceFromMesh(decoded, i, face);
      return [face.GetValue(0), face.GetValue(1), face.GetValue(2)];
    });
    for (const item of [face, status, decoded, decoder, buffer]) draco.destroy(item);
    return { positions, uv, triangles, material: primitive.material };
  });
  process.stdout.write(JSON.stringify(meshes));
})();
