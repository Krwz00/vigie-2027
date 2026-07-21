import type { Candidate, CandidateId } from "./types";

/**
 * Trombinoscope + tokens couleur par candidat (map de la maquette).
 * `photo` pointe vers /public/candidates/<id>.jpg ; si le fichier est absent,
 * l'UI retombe sur le monogramme `mono`.
 */
export const CANDIDATES: Record<CandidateId, Candidate> = {
  lepen: {
    id: "lepen",
    last: "Le Pen",
    name: "Marine Le Pen",
    party: "Rassemblement national",
    mono: "LP",
    color: "#6f9bff",
    photo: "/candidates/lepen.jpg",
  },
  bardella: {
    id: "bardella",
    last: "Bardella",
    name: "Jordan Bardella",
    party: "Rassemblement national",
    mono: "JB",
    color: "#3f6fd6",
    photo: "/candidates/bardella.jpg",
  },
  philippe: {
    id: "philippe",
    last: "Philippe",
    name: "Édouard Philippe",
    party: "Horizons",
    mono: "ÉP",
    color: "#23c4a8",
    photo: "/candidates/philippe.jpg",
  },
  melenchon: {
    id: "melenchon",
    last: "Mélenchon",
    name: "Jean-Luc Mélenchon",
    party: "La France insoumise",
    mono: "JLM",
    color: "#e5484d",
    photo: "/candidates/melenchon.jpg",
  },
  attal: {
    id: "attal",
    last: "Attal",
    name: "Gabriel Attal",
    party: "Renaissance",
    mono: "GA",
    color: "#e8b13a",
    photo: "/candidates/attal.jpg",
  },
  glucksmann: {
    id: "glucksmann",
    last: "Glucksmann",
    name: "Raphaël Glucksmann",
    party: "Place publique",
    mono: "RG",
    color: "#ec6a9c",
    photo: "/candidates/glucksmann.jpg",
  },
  retailleau: {
    id: "retailleau",
    last: "Retailleau",
    name: "Bruno Retailleau",
    party: "Les Républicains",
    mono: "BR",
    color: "#7fb3e0",
    photo: "/candidates/retailleau.jpg",
  },
  darmanin: {
    id: "darmanin",
    last: "Darmanin",
    name: "Gérald Darmanin",
    party: "Renaissance",
    mono: "GD",
    color: "#9b8cff",
    photo: "/candidates/darmanin.jpg",
  },
  zemmour: {
    id: "zemmour",
    last: "Zemmour",
    name: "Éric Zemmour",
    party: "Reconquête",
    mono: "ÉZ",
    color: "#b5544c",
    photo: "/candidates/zemmour.jpg",
  },
  tondelier: {
    id: "tondelier",
    last: "Tondelier",
    name: "Marine Tondelier",
    party: "Les Écologistes",
    mono: "MT",
    color: "#3fae6b",
    photo: "/candidates/tondelier.jpg",
  },
  roussel: {
    id: "roussel",
    last: "Roussel",
    name: "Fabien Roussel",
    party: "Parti communiste",
    mono: "FR",
    color: "#d6455a",
    photo: "/candidates/roussel.jpg",
  },
  dupontaignan: {
    id: "dupontaignan",
    last: "Dupont-Aignan",
    name: "Nicolas Dupont-Aignan",
    party: "Debout la France",
    mono: "NDA",
    color: "#c98a4a",
    photo: "/candidates/dupontaignan.jpg",
  },

  // ── Candidats supplémentaires présents dans le dépôt MieuxVoter ──
  // Couleurs attribuées par famille politique, distinctes des 12 d'origine.
  hollande: {
    id: "hollande",
    last: "Hollande",
    name: "François Hollande",
    party: "Parti socialiste",
    mono: "FH",
    color: "#d24b8a",
    photo: "/candidates/hollande.jpg",
  },
  ruffin: {
    id: "ruffin",
    last: "Ruffin",
    name: "François Ruffin",
    party: "Debout / gauche",
    mono: "FRu",
    color: "#c0392f",
    photo: "/candidates/ruffin.jpg",
  },
  villepin: {
    id: "villepin",
    last: "de Villepin",
    name: "Dominique de Villepin",
    party: "Divers",
    mono: "DdV",
    color: "#8f7fc0",
    photo: "/candidates/villepin.jpg",
  },
  bayrou: {
    id: "bayrou",
    last: "Bayrou",
    name: "François Bayrou",
    party: "MoDem",
    mono: "FB",
    color: "#cf8a3a",
    photo: "/candidates/bayrou.jpg",
  },
  bertrand: {
    id: "bertrand",
    last: "Bertrand",
    name: "Xavier Bertrand",
    party: "Les Républicains",
    mono: "XB",
    color: "#6d9fd0",
    photo: "/candidates/bertrand.jpg",
  },
  faure: {
    id: "faure",
    last: "Faure",
    name: "Olivier Faure",
    party: "Parti socialiste",
    mono: "OF",
    color: "#b5497f",
    photo: "/candidates/faure.jpg",
  },
  wauquiez: {
    id: "wauquiez",
    last: "Wauquiez",
    name: "Laurent Wauquiez",
    party: "Les Républicains",
    mono: "LW",
    color: "#5a86c0",
    photo: "/candidates/wauquiez.jpg",
  },
  lisnard: {
    id: "lisnard",
    last: "Lisnard",
    name: "David Lisnard",
    party: "Les Républicains",
    mono: "DL",
    color: "#86b0dc",
    photo: "/candidates/lisnard.jpg",
  },
  lecornu: {
    id: "lecornu",
    last: "Lecornu",
    name: "Sébastien Lecornu",
    party: "Renaissance / LR",
    mono: "SL",
    color: "#4f79b0",
    photo: "/candidates/lecornu.jpg",
  },
  knafo: {
    id: "knafo",
    last: "Knafo",
    name: "Sarah Knafo",
    party: "Reconquête",
    mono: "SK",
    color: "#9a4038",
    photo: "/candidates/knafo.jpg",
  },
  arthaud: {
    id: "arthaud",
    last: "Arthaud",
    name: "Nathalie Arthaud",
    party: "Lutte ouvrière",
    mono: "NA",
    color: "#cf3a3a",
    photo: "/candidates/arthaud.jpg",
  },
  poutou: {
    id: "poutou",
    last: "Poutou",
    name: "Philippe Poutou",
    party: "NPA",
    mono: "PP",
    color: "#d05050",
    photo: "/candidates/poutou.jpg",
  },
  devilliers: {
    id: "devilliers",
    last: "de Villiers",
    name: "Philippe de Villiers",
    party: "Souverainiste",
    mono: "PdV",
    color: "#b07a4a",
    photo: "/candidates/devilliers.jpg",
  },
};

/**
 * Table EXPLICITE candidate_id (dépôt MieuxVoter) → id maquette.
 * Établie en lisant candidats.csv (surname), jamais devinée. Tout candidate_id
 * absent de cette table est logué comme « non mappé » (cf. lib/mieuxvoter.ts),
 * jamais rattaché silencieusement.
 */
export const MV_ID_MAP: Record<string, CandidateId> = {
  MLP: "lepen",
  JB: "bardella",
  EP: "philippe",
  JLM: "melenchon",
  GA: "attal",
  RG: "glucksmann",
  BR: "retailleau",
  GD: "darmanin",
  EZ: "zemmour",
  MT: "tondelier",
  FRo: "roussel",
  NDA: "dupontaignan",
  FH: "hollande",
  FR: "ruffin",
  DV: "villepin",
  FB: "bayrou",
  XB: "bertrand",
  OF: "faure",
  LW: "wauquiez",
  DL: "lisnard",
  SL: "lecornu",
  SK: "knafo",
  NA: "arthaud",
  PP: "poutou",
  PdV: "devilliers",
};

/** Ordre d'itération (le classement final est de toute façon trié par score). */
export const CANDIDATE_ORDER: CandidateId[] = [
  "lepen",
  "bardella",
  "philippe",
  "melenchon",
  "attal",
  "glucksmann",
  "retailleau",
  "darmanin",
  "zemmour",
  "tondelier",
  "roussel",
  "dupontaignan",
  "hollande",
  "ruffin",
  "villepin",
  "bayrou",
  "bertrand",
  "faure",
  "wauquiez",
  "lisnard",
  "lecornu",
  "knafo",
  "arthaud",
  "poutou",
  "devilliers",
];

export function getCandidate(id: CandidateId): Candidate {
  return CANDIDATES[id];
}

/** Résout un nom libre (issu d'une hypothèse/duel/RSS) vers un CandidateId. */
export function resolveCandidateId(name: string): CandidateId | null {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
  const table: Record<string, CandidateId> = {
    "le pen": "lepen",
    lepen: "lepen",
    "marine le pen": "lepen",
    bardella: "bardella",
    "jordan bardella": "bardella",
    philippe: "philippe",
    "edouard philippe": "philippe",
    melenchon: "melenchon",
    "jean-luc melenchon": "melenchon",
    attal: "attal",
    "gabriel attal": "attal",
    glucksmann: "glucksmann",
    retailleau: "retailleau",
    darmanin: "darmanin",
    zemmour: "zemmour",
    tondelier: "tondelier",
    roussel: "roussel",
    "dupont-aignan": "dupontaignan",
    "dupont aignan": "dupontaignan",
    hollande: "hollande",
    ruffin: "ruffin",
    "de villepin": "villepin",
    villepin: "villepin",
    bayrou: "bayrou",
    bertrand: "bertrand",
    faure: "faure",
    wauquiez: "wauquiez",
    lisnard: "lisnard",
    lecornu: "lecornu",
    knafo: "knafo",
    arthaud: "arthaud",
    poutou: "poutou",
    "de villiers": "devilliers",
    villiers: "devilliers",
  };
  return table[n] ?? null;
}

/** Couleur pour un nom libre : soit un candidat connu, soit une couleur neutre. */
export function colorForName(name: string): string {
  const id = resolveCandidateId(name);
  if (id) return CANDIDATES[id].color;
  return "#7f93b3"; // Hollande, Ruffin… : couleur neutre
}
