import type { BoneSelection } from "./types";

const materialKey = (name: string) => name.replace(/\.\d+$/, "");

// Nomenclatura de docs/catalogo-de-estruturas-anatomicas.md.
const boneNames: Record<string, string> = {
  Atlas: "1ª Vértebra Cervical C1 (Atlas)",
  Axis: "2ª Vértebra Cervical C2 (Áxis)",
  "Body of sternum": "Corpo do Esterno",
  sternum: "Manúbrio do Esterno",
  sacrum: "(Osso Sacro) Vértebras Sacrais",
  Coccyx: "(Osso Cóccix) Vértebras Coccígeas",
  clavicle: "Clavícula",
  Scapula: "Escápula",
  "Articular cartilage": "Cartilagem costal",
  "Ethmoid Bone": "Osso Etmoide",
  "Frontal bone": "Osso Frontal",
  "Mandible bone": "Osso Mandíbula",
  "Occipital bone": "Osso Occipital",
  "Parietal bone": "Osso Parietal",
  "Sphenoid bone": "Osso Esfenoide",
  Vomer: "Osso Vômer",
  "Inferior nasal concha bone": "Osso Concha Nasal Inferior",
  "Lacrimal bone": "Osso Lacrimal",
  "Lower canine": "Osso Canino Inferior",
  "Lower first molar tooth": "Osso Primeiro Molar Inferior",
  "Lower first premolar": "Osso Primeiro Pré-Molar Inferior",
  "Lower lateral incisor": "Osso Incisivo Lateral Inferior",
  "Lower medial incisor": "Osso Incisivo Central Inferior",
  "Lower second molar tooth": "Osso Segundo Molar Inferior",
  "Lower second premolar": "Osso Segundo Pré-Molar Inferior",
  "Maxilla bone": "Osso Maxilar",
  "Nasal bone": "Osso Nasal",
  "Palatine bone": "Osso Palatino",
  "Temporal bone": "Osso Temporal",
  "Upper canine": "Osso Canino Superior",
  "Upper first molar tooth": "Osso Primeiro Molar Superior",
  "Upper first premolar": "Osso Primeiro Pré-Molar Superior",
  "Upper lateral incisor": "Osso Incisivo Lateral Superior",
  "Upper medial incisor": "Osso Incisivo Central Superior",
  "Upper second molar tooth": "Osso Segundo Molar Superior",
  "Upper second premolar": "Osso Segundo Pré-Molar Superior",
  "Zygomatic bone": "Osso Zigomático",
};

export { materialKey };

export function boneSelection(
  materialName: string,
  meshName: string,
): BoneSelection {
  const normalizedMaterial = materialKey(materialName);
  const key = normalizedMaterial.replace(/[._][lr]$/, "");
  const normalizedMesh = materialKey(meshName).replace(/\.$/, "");
  const vertebra = /^Vertebra_([CTL])(\d+)$/.exec(key);
  const rib = /^(\d+)(?:st|nd|rd|th)_rib$/.exec(key);
  const regions: Record<string, string> = {
    C: "Vértebra Cervical Típica",
    T: "Vértebra Torácica",
    L: "Vértebra Lombar",
  };

  const side =
    /(?:[._]l$|\bleft\b)/i.test(normalizedMesh) || /[._]l$/i.test(normalizedMaterial)
      ? "E"
      : /(?:[._]r$|\bright\b)/i.test(normalizedMesh) || /[._]r$/i.test(normalizedMaterial)
        ? "D"
        : null;

  const name = vertebra
    ? key === "Vertebra_C7"
      ? "7ª Vértebra Cervical C7 (Proeminente)"
      : regions[vertebra[1]]
    : rib
      ? `${rib[1]}ª costela`
      : boneNames[key] ?? key;

  return { name, side };
}
