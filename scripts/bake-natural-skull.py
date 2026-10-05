"""Bake bone color into GLB UV textures; preserves Draco geometry and anatomical normals.
Run from the repository root: python3 scripts/bake-natural-skull.py
Requires numpy, Pillow and installed npm dependencies. No network or renderer needed.
"""
import argparse
import io
import json
import re
import struct
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--format", choices=["JPEG", "PNG"], default="JPEG")
parser.add_argument("--output", default="public/overview-skull-natural.glb")
args = parser.parse_args()

SIZE = 512
JPEG_QUALITY = 90
source = Path('public/overview-skull.glb').read_bytes()
json_length = struct.unpack_from('<I', source, 12)[0]
doc = json.loads(source[20:20 + json_length])
binary = bytearray(source[28 + json_length:])
meshes = json.loads(subprocess.check_output(['node', 'scripts/decode-skull.cjs']))
minimum = np.min([np.min(m['positions'], axis=0) for m in meshes], axis=0)
maximum = np.max([np.max(m['positions'], axis=0) for m in meshes], axis=0)
radius = np.linalg.norm(maximum - minimum) / 2


def noise(p):
    cell = np.floor(p)
    f = p - cell
    f = f * f * (3 - 2 * f)
    result = np.zeros(p.shape[:-1])
    for x in range(2):
        for y in range(2):
            for z in range(2):
                q = np.mod((cell + [x, y, z]) * .1031, 1)
                q += np.sum(q * (q[..., [1, 2, 0]] + 33.33), axis=-1)[..., None]
                h = np.mod((q[..., 0] + q[..., 1]) * q[..., 2], 1)
                weight = np.prod(np.where([x, y, z], f, 1 - f), axis=-1)
                result += weight * h
    return result


def color(p):
    p = p / radius
    cloud, grain, pores = noise(p * 18), noise(p * 130), noise(p * 240)
    pores = np.clip((pores - .72) / .18, 0, 1)
    pores = pores * pores * (3 - 2 * pores)
    tint = np.array([.90, .84, .73]) + cloud[..., None] * [.10, .13, .17]
    base = np.array([222, 210, 185]) / 255
    linear = np.where(base <= .04045, base / 12.92, ((base + .055) / 1.055) ** 2.4)
    value = linear * tint * ( .97 + .06 * grain[..., None]) * (1 - .12 * pores[..., None])
    srgb = np.where(value <= .0031308, value * 12.92, 1.055 * value ** (1 / 2.4) - .055)
    return np.clip(srgb * 255, 0, 255).astype(np.uint8)


for mesh in meshes:
    material = doc['materials'][mesh['material']]
    pbr = material['pbrMetallicRoughness']
    tooth = bool(re.search('canine|molar|premolar|incisor|tooth', material['name'], re.I))
    pbr.update(metallicFactor=0, roughnessFactor=.38 if tooth else .78)
    if tooth:
        rgb = np.array([238, 232, 216]) / 255
        pbr['baseColorFactor'] = [*(((rgb + .055) / 1.055) ** 2.4).tolist(), 1]
        continue
    positions, uv = np.array(mesh['positions']), np.array(mesh['uv']) * SIZE - .5
    pixels = np.zeros((SIZE, SIZE, 3), dtype=np.uint8)
    mask = np.zeros((SIZE, SIZE), dtype=np.uint8)
    for face in mesh['triangles']:
        triangle = uv[face]
        lo = np.maximum(np.ceil(triangle.min(axis=0)).astype(int), 0)
        hi = np.minimum(np.floor(triangle.max(axis=0)).astype(int), SIZE - 1)
        if np.any(lo > hi):
            continue
        a, b, c = triangle
        determinant = (b-a)[0] * (c-a)[1] - (b-a)[1] * (c-a)[0]
        if abs(determinant) < 1e-10:
            continue
        yy, xx = np.mgrid[lo[1]:hi[1]+1, lo[0]:hi[0]+1]
        delta = np.stack([xx, yy], axis=-1) - a
        w1 = (delta[..., 0] * (c-a)[1] - delta[..., 1] * (c-a)[0]) / determinant
        w2 = ((b-a)[0] * delta[..., 1] - (b-a)[1] * delta[..., 0]) / determinant
        inside = (w1 >= -1e-6) & (w2 >= -1e-6) & (w1 + w2 <= 1.000001)
        x, y = xx[inside], yy[inside]
        if not len(x):
            continue
        weights = np.stack([1-w1[inside]-w2[inside], w1[inside], w2[inside]], axis=-1)
        pixels[y, x] = color(weights @ positions[face])
        mask[y, x] = 255
    # Dilate UV borders for bilinear filtering and mipmaps, avoiding dark seams.
    for _ in range(8):
        expanded = np.array(Image.fromarray(mask).filter(ImageFilter.MaxFilter(3)))
        border = (mask == 0) & (expanded != 0)
        padded = np.array(Image.fromarray(pixels).filter(ImageFilter.MaxFilter(3)))
        pixels[border] = padded[border]
        mask = expanded
    pixels[mask == 0] = [216, 203, 177]
    image = io.BytesIO()
    if args.format == 'JPEG':
        Image.fromarray(pixels).save(image, format='JPEG', quality=JPEG_QUALITY, subsampling=0, optimize=True)
    else:
        Image.fromarray(pixels).save(image, format='PNG')
    while len(binary) % 4:
        binary.append(0)
    view = len(doc['bufferViews'])
    data = image.getvalue()
    doc['bufferViews'].append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(data)})
    binary.extend(data)
    index = len(doc['images'])
    doc['images'].append({'bufferView': view, 'mimeType': 'image/jpeg' if args.format == 'JPEG' else 'image/png', 'name': material['name'] + ' baked color'})
    texture = len(doc['textures'])
    doc['textures'].append({'source': index})
    pbr.update(baseColorFactor=[1, 1, 1, 1], baseColorTexture={'index': texture})
    print('Baked', material['name'])

doc['buffers'][0]['byteLength'] = len(binary)
metadata = json.dumps(doc, separators=(',', ':')).encode()
metadata += b' ' * (-len(metadata) % 4)
binary.extend(b'\0' * (-len(binary) % 4))
output = struct.pack('<III', 0x46546C67, 2, 28 + len(metadata) + len(binary))
output += struct.pack('<II', len(metadata), 0x4E4F534A) + metadata
output += struct.pack('<II', len(binary), 0x004E4942) + binary
Path(args.output).write_bytes(output)
print('Saved natural skull:', len(output), 'bytes')
