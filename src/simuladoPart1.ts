import type { Question } from "./questions";

export const SIMULADO_PART_1: Question[] = [
  {
    "id": "simulado-1", "sourceNumber": 1, "category": "skull", "kind": "name",
    "title":
    "Estrutura óssea localizada na região anterior do crânio, formando grande " +
    "parte da testa.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Osso frontal", "accepted": [
      "frontal"
    ], "explanation": "", "model": "overview-skull-natural",
    "highlight": "Frontal bone"
  },
  {
    "id": "simulado-2", "sourceNumber": 2, "category": "skull", "kind": "name",
    "title": "Osso localizado lateralmente no crânio, relacionado à região das têmporas.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Osso temporal", "accepted": [
      "temporal"
    ], "explanation": "", "model": "overview-skull-natural",
    "highlight": "Temporal bone"
  },
  {
    "id": "simulado-3", "sourceNumber": 3, "category": "skull", "kind": "name",
    "title": "Abertura localizada na base do crânio por onde passa a medula espinal.",
    "instruction": "Responda com o termo anatômico.", "answer": "Forame magno", "accepted": [],
    "explanation": ""
  },
  {
    "id": "simulado-4", "sourceNumber": 4, "category": "skull", "kind": "name",
    "title": "Osso da face que forma a região das maçãs do rosto.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Osso zigomático", "accepted": [
      "zigomático"
    ], "explanation": "", "model": "overview-skull-natural",
    "highlight": "Zygomatic bone"
  },
  {
    "id": "simulado-5", "sourceNumber": 5, "category": "skull", "kind": "name",
    "title": "Osso da face que forma a mandíbula e se articula com os ossos temporais.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Mandíbula", "accepted": [
      "osso mandíbula", "osso mandibular"
    ], "explanation": "", "model": "overview-skull-natural",
    "highlight": "Mandible bone"
  },
  {
    "id": "simulado-6", "sourceNumber": 6, "category": "thorax", "kind": "name",
    "title": "Parte superior do esterno, articulada com as clavículas.",
    "instruction": "Responda com o termo anatômico.", "answer": "Manúbrio do esterno",
    "accepted": [], "explanation": ""
  },
  {
    "id": "simulado-7", "sourceNumber": 7, "category": "spine", "kind": "name",
    "title": "Primeira vértebra cervical, também conhecida como C1.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Vértebra cervical atlas", "accepted": [
      "primeira vértebra cervical (atlas)"
    ], "incompleteAccepted": ["atlas", "C1", "vértebra atlas", "primeira vértebra cervical"], "explanation": "", "model": "spine-cervical-practice",
    "highlight": "Atlas", "isolatedBones": [
      "Atlas"
    ]
  },
  {
    "id": "simulado-8", "sourceNumber": 8, "category": "spine", "kind": "name",
    "title": "Segunda vértebra cervical, também conhecida como C2.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Vértebra cervical áxis", "accepted": [
      "segunda vértebra cervical (áxis)"
    ], "incompleteAccepted": ["áxis", "axis", "C2", "vértebra áxis", "segunda vértebra cervical"], "explanation": "", "model": "spine-cervical-practice",
    "highlight": "Axis", "isolatedBones": [
      "Axis"
    ]
  },
  {
    "id": "simulado-9", "sourceNumber": 9, "category": "spine", "kind": "name",
    "title":
    "Vértebra cervical que apresenta processo espinhoso bastante proeminente e " +
    "corresponde à C7.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Vértebra proeminente", "accepted": [
      "C7", "sétima vértebra cervical", "vértebra cervical C7"
    ], "explanation": "",
    "model": "spine-cervical-practice", "highlight": "Vertebra_C7", "isolatedBones": [
      "Vertebra_C7"
    ]
  },
  {
    "id": "simulado-10", "sourceNumber": 10, "category": "upper", "kind": "name",
    "title": "Osso que forma o esqueleto do braço, entre o ombro e o cotovelo.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Úmero", "accepted": [
      "osso úmero"
    ], "explanation": "", "model": "skeleton-practice",
    "highlight": "humerus",
    "isolatedBones": ["humerus"]
  },
  {
    "id": "simulado-11", "sourceNumber": 11, "category": "upper", "kind": "name",
    "title": "Extremidade proximal do úmero que se articula com a escápula.",
    "instruction": "Responda com o termo anatômico.", "answer": "Cabeça do úmero", "accepted": [],
    "explanation": ""
  },
  {
    "id": "simulado-12", "sourceNumber": 12, "category": "upper", "kind": "name",
    "title": "Osso do antebraço localizado no lado do polegar, na posição anatômica.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Rádio", "accepted": [
      "osso rádio"
    ], "explanation": "", "model": "skeleton-practice",
    "highlight": "radius",
    "isolatedBones": ["radius"]
  },
  {
    "id": "simulado-13", "sourceNumber": 13, "category": "upper", "kind": "name",
    "title": "Osso do antebraço localizado no lado do dedo mínimo, na posição anatômica.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Ulna", "accepted": [
      "osso ulna"
    ], "explanation": "", "model": "skeleton-practice", "highlight": "ulna",
    "isolatedBones": ["ulna"]
  },
  {
    "id": "simulado-14", "sourceNumber": 14, "category": "lower", "kind": "name",
    "title": "Osso da coxa.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Fêmur", "accepted": [
      "osso fêmur"
    ], "explanation": "", "model": "skeleton-practice",
    "highlight": "femur",
    "isolatedBones": ["femur"]
  },
  {
    "id": "simulado-15", "sourceNumber": 15, "category": "lower", "kind": "name",
    "title": "Extremidade proximal do fêmur que se articula com o osso do quadril.",
    "instruction": "Responda com o termo anatômico.", "answer": "Cabeça do fêmur", "accepted": [],
    "explanation": ""
  },
  {
    "id": "simulado-16", "sourceNumber": 16, "category": "lower", "kind": "name",
    "title": "Osso localizado anteriormente na articulação do joelho.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Patela", "accepted": [
      "osso patela"
    ], "explanation": "", "model": "skeleton-practice",
    "highlight": "Patella",
    "isolatedBones": ["Patella"]
  },
  {
    "id": "simulado-17", "sourceNumber": 17, "category": "lower", "kind": "name",
    "title": "Osso da perna localizado medialmente.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Tíbia", "accepted": [
      "osso tíbia"
    ], "explanation": "", "model": "skeleton-practice",
    "highlight": "Tibia",
    "isolatedBones": ["Tibia"]
  },
  {
    "id": "simulado-18", "sourceNumber": 18, "category": "lower", "kind": "name",
    "title": "Osso da perna localizado lateralmente.",
    "instruction": "Observe a estrutura no modelo 3D e responda com seu nome anatômico.",
    "answer": "Fíbula", "accepted": [
      "osso fíbula"
    ], "explanation": "", "model": "skeleton-practice",
    "highlight": "Fibula",
    "isolatedBones": ["Fibula"]
  },
  {
    "id": "simulado-19", "sourceNumber": 19, "category": "skull", "kind": "name",
    "title": "Articulação fibrosa entre os dois ossos parietais.",
    "instruction": "Responda com o termo anatômico.", "answer": "Sutura sagital", "accepted": ["sutura interparietal"],
    "explanation": ""
  },
  {
    "id": "simulado-20", "sourceNumber": 20, "category": "skull", "kind": "name",
    "title": "Articulação fibrosa entre o osso frontal e os ossos parietais.",
    "instruction": "Responda com o termo anatômico.", "answer": "Sutura coronal", "accepted": ["sutura frontoparietal"],
    "explanation": ""
  },
  {
    "id": "simulado-21", "sourceNumber": 21, "category": "spine", "kind": "name",
    "title": "Estrutura cartilagínea localizada entre os corpos das vértebras.",
    "instruction": "Responda com o termo anatômico.", "answer": "Disco intervertebral",
    "accepted": [], "explanation": ""
  },
  {
    "id": "simulado-22", "sourceNumber": 22, "category": "lower", "kind": "name",
    "title": "Articulação localizada entre os dois ossos púbicos.",
    "instruction": "Responda com o termo anatômico.", "answer": "Sínfise púbica", "accepted": [],
    "explanation": ""
  },
  {
    "id": "simulado-23", "sourceNumber": 23, "category": "lower", "kind": "name",
    "title": "Ligamento localizado dentro da articulação do joelho e conhecido pela sigla LCA.",
    "instruction": "Responda com o termo anatômico.", "answer": "Ligamento cruzado anterior",
    "accepted": [], "explanation": ""
  },
  {
    "id": "simulado-24", "sourceNumber": 24, "category": "lower", "kind": "name",
    "title": "Estrutura fibrocartilagínea localizada na região medial do joelho.",
    "instruction": "Responda com o termo anatômico.", "answer": "Menisco medial", "accepted": [],
    "explanation": ""
  }
];
