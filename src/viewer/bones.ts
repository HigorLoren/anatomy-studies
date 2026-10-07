import type { BoneSelection } from "./types";

const materialKey = (name: string) => name.replace(/\.\d+$/, "");

// Nomenclatura de docs/catalogo-de-estruturas-anatomicas.md.
const boneNames: Record<string, string> = {
  "Muscle tile plain": "Músculo (nome não identificado)",
  "Muscle basic": "Músculo (nome não identificado)",
  "Muscle long tendons": "Músculo (nome não identificado)",
  humerus: "Osso úmero",
  radius: "Osso rádio",
  ulna: "Osso ulna",
  femur: "Osso fêmur",
  Patella: "Osso patela",
  Tibia: "Osso tíbia",
  Fibula: "Osso fíbula",
  Atlas: "1ª Vértebra Cervical C1 (Atlas)",
  Axis: "2ª Vértebra Cervical C2 (Áxis)",
  "Body of sternum": "Corpo do Esterno",
  sternum: "Manúbrio do Esterno",
  sacrum: "(Osso Sacro) Vértebras Sacrais",
  Coccyx: "(Osso Cóccix) Vértebras Coccígeas",
  clavicle: "Clavícula",
  Scapula: "Escápula",
  "Articular cartilage": "Cartilagem articular",
  artcartmat: "Cartilagem articular",
  "Hip bone": "Osso do quadril",
  "Xiphoid process": "Processo xifoide",
  "Ethmoid Bone": "Osso Etmoide",
  "Frontal bone": "Osso Frontal",
  "Mandible bone": "Osso Mandíbula",
  "Occipital bone": "Osso Occipital",
  "Parietal bone": "Osso Parietal",
  "Sphenoid bone": "Osso Esfenoide",
  Vomer: "Osso Vômer",
  "Inferior nasal concha bone": "Osso Concha Nasal Inferior",
  "Lacrimal bone": "Osso Lacrimal",
  "Lower canine": "Dente Canino Inferior",
  "Lower first molar tooth": "Dente Primeiro Molar Inferior",
  "Lower first premolar": "Dente Primeiro Pré-Molar Inferior",
  "Lower lateral incisor": "Dente Incisivo Lateral Inferior",
  "Lower medial incisor": "Dente Incisivo Central Inferior",
  "Lower second molar tooth": "Dente Segundo Molar Inferior",
  "Lower second premolar": "Dente Segundo Pré-Molar Inferior",
  "Maxilla bone": "Osso Maxilar",
  "Nasal bone": "Osso Nasal",
  "Palatine bone": "Osso Palatino",
  "Temporal bone": "Osso Temporal",
  "Upper canine": "Dente Canino Superior",
  "Upper first molar tooth": "Dente Primeiro Molar Superior",
  "Upper first premolar": "Dente Primeiro Pré-Molar Superior",
  "Upper lateral incisor": "Dente Incisivo Lateral Superior",
  "Upper medial incisor": "Dente Incisivo Central Superior",
  "Upper second molar tooth": "Dente Segundo Molar Superior",
  "Upper second premolar": "Dente Segundo Pré-Molar Superior",
  "Zygomatic bone": "Osso Zigomático",
};

// Materiais de textura são compartilhados; a identificação depende do nó anatômico.
const nodeNames: Record<string, string> = {
  "Deltoid muscle": "Músculo deltoide",
  "Gluteus maximus muscle": "Músculo glúteo máximo",
  "Gluteus medius muscle": "Músculo glúteo médio",
  "Gluteus minimus muscle": "Músculo glúteo mínimo",
  "Pectoralis major": "Músculo peitoral maior",
  "Pectoralis minor muscle": "Músculo peitoral menor",
  "Trapezius muscle": "Músculo trapézio",
  "Latissimus dorsi": "Músculo latíssimo do dorso",
  "Serratus anterior muscle": "Músculo serrátil anterior",
  "Brachialis muscle": "Músculo braquial",
  Brachioradialis: "Músculo braquiorradial",
  "Piriformis muscle": "Músculo piriforme",
  "Adductor longus": "Músculo adutor longo",
  "Adductor brevis": "Músculo adutor curto",
  "Adductor magnus": "Músculo adutor magno",
  "Gracilis muscle": "Músculo grácil",
  "Long head of biceps femoris": "Músculo bíceps femoral (cabeça longa)",
  "Short head of biceps femoris": "Músculo bíceps femoral (cabeça curta)",
  "Semitendinosus muscle": "Músculo semitendíneo",
  "Semimembranosus muscle": "Músculo semimembranáceo",
  "Tibialis posterior muscle": "Músculo tibial posterior",
};

export { materialKey };

export function boneSelection(
  materialName: string,
  meshName: string,
  anatomyNames: string[] = [meshName],
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

  const side = anatomicalSide(normalizedMaterial, normalizedMesh, anatomyNames);

  const normalizedNodes = anatomyNames.map(name => materialKey(name)
    .replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/[._][lr]$/, "").trim());
  const nodeName = normalizedNodes.map(name => nodeNames[name]).find(Boolean);
  const costalCartilage = normalizedNodes.some(name => /costal[ _]cart/i.test(name));
  const name = costalCartilage && key === "Articular cartilage"
    ? "Cartilagem costal"
    : nodeName ?? (vertebra
      ? key === "Vertebra_C7"
        ? "7ª Vértebra Cervical C7 (Proeminente)"
        : regions[vertebra[1]]
      : rib
        ? `${rib[1]}ª costela`
        : boneNames[key] ?? key);

  return { name, side };
}

function anatomicalSide(material: string, mesh: string, anatomyNames: string[]): BoneSelection["side"] {
  const names = [material, mesh, ...anatomyNames].map(materialKey);
  if (names.some(name => /(?:[._]l$|\bleft\b)/i.test(name))) return "E";
  if (names.some(name => /(?:[._]r$|\bright\b)/i.test(name))) return "D";
  return null;
}
