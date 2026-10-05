import type { BoneSelection } from "./types";

const materialKey = (name: string) => name.replace(/\.\d+$/, "");

const boneNames: Record<string, string> = {
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
  const key = materialKey(materialName).replace(/[._][lr]$/, "");

  const side =
    /(?:[._]l$|\bleft\b)/i.test(meshName) || /[._]l$/i.test(materialName)
      ? "E"
      : /(?:[._]r$|\bright\b)/i.test(meshName) || /[._]r$/i.test(materialName)
        ? "D"
        : null;

  return { name: boneNames[key] ?? key, side };
}
