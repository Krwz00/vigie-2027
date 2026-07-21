import type { CandidateId, Poll } from "./types";

/**
 * ⚠️ FIXTURE DE TEST UNIQUEMENT — n'est JAMAIS servie en production.
 * Données illustratives extraites de la maquette (juillet 2026). La production
 * consomme exclusivement la source réelle MieuxVoter (cf. lib/mieuxvoter.ts +
 * lib/data.ts). Conservé ici comme jeu de données stable pour les tests
 * d'agrégation et de rendu.
 */

export const MILESTONES = [
  "Sep 24",
  "Déc 24",
  "Mar 25",
  "Juin 25",
  "Sep 25",
  "Déc 25",
  "Fév 26",
  "Mar 26",
  "Avr 26",
  "Mai 26",
  "Juin 26",
  "Juil 26",
];

/** Séries agrégées de 1er tour (%) — une valeur par échéance de MILESTONES. */
export const SEED_SERIES: Partial<Record<CandidateId, (number | null)[]>> = {
  lepen: [33, 33, 34, 34, 33, 33, 33, 34, 34, 34, 35, 36],
  bardella: [31, 32, 33, 34, 34, 35, 35, 36, 36, 35, 34, 34],
  philippe: [22, 22, 21, 21, 20, 20, 19, 18, 18, 18, 17, 17],
  melenchon: [12, 12, 12, 12, 12, 13, 13, 13, 14, 15, 16, 16],
  attal: [15, 14, 14, 14, 14, 13, 13, 13, 13, 13, 13, 14],
  glucksmann: [8, 9, 9, 10, 10, 10, 11, 11, 11, 11, 11, 11],
  retailleau: [7, 7, 8, 8, 9, 9, 9, 9, 10, 10, 10, 9],
  darmanin: [6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 8, 8],
  zemmour: [6, 6, 5, 5, 5, 4, 4, 4, 4, 4, 3, 3],
  tondelier: [3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4],
  roussel: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  dupontaignan: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
};

/** Fil des sondages publiés (antéchronologique). */
export const SEED_POLLS: Poll[] = [
  {
    institute: "Elabe",
    sponsor: "BFMTV · La Tribune Dimanche",
    publishedAt: "2026-07-11",
    fieldStart: "2026-07-09",
    fieldEnd: "2026-07-10",
    sampleSize: 1503,
    hypothesis: "Philippe",
    scores: { lepen: 35, philippe: 16.5, melenchon: 16, glucksmann: 10.5 },
    isNew: true,
  },
  {
    institute: "OpinionWay",
    sponsor: "Les Échos · Radio Classique",
    publishedAt: "2026-07-09",
    fieldStart: "2026-07-08",
    fieldEnd: "2026-07-09",
    sampleSize: 963,
    hypothesis: "Philippe",
    scores: { lepen: 35, philippe: 15, melenchon: 15, attal: 8 },
    isNew: true,
  },
  {
    institute: "Ifop-Fiducial",
    sponsor: "LCI · Le Figaro",
    publishedAt: "2026-07-08",
    fieldStart: "2026-07-07",
    fieldEnd: "2026-07-08",
    sampleSize: 1004,
    hypothesis: "Attal",
    scores: { lepen: 36, philippe: 16, attal: 11, darmanin: 8 },
    isNew: true,
  },
  {
    institute: "Cluster17",
    sponsor: "Le Point",
    publishedAt: "2026-06-29",
    fieldStart: "2026-06-27",
    fieldEnd: "2026-06-28",
    sampleSize: 1520,
    hypothesis: "Bardella",
    scores: { bardella: 34, philippe: 17, melenchon: 15, glucksmann: 11 },
  },
  {
    institute: "Toluna Harris Interactive",
    sponsor: "M6 · RTL",
    publishedAt: "2026-06-22",
    fieldStart: "2026-06-20",
    fieldEnd: "2026-06-21",
    sampleSize: 1500,
    hypothesis: "Bardella",
    scores: { bardella: 35, philippe: 18, melenchon: 14, attal: 13 },
  },
  {
    institute: "Odoxa-Mascaret",
    sponsor: "Public Sénat · PQR",
    publishedAt: "2026-05-24",
    fieldStart: "2026-05-22",
    fieldEnd: "2026-05-23",
    sampleSize: 1005,
    hypothesis: "Bardella",
    scores: { bardella: 32, philippe: 17, melenchon: 16, glucksmann: 10 },
  },
  {
    institute: "Ipsos",
    sponsor: "La Tribune Dimanche",
    publishedAt: "2026-05-11",
    fieldStart: "2026-05-09",
    fieldEnd: "2026-05-10",
    sampleSize: 1200,
    hypothesis: "Bardella",
    scores: { bardella: 33, philippe: 18, attal: 13, melenchon: 13 },
  },
  {
    institute: "OpinionWay",
    sponsor: "Les Échos",
    publishedAt: "2026-05-05",
    fieldStart: "2026-05-04",
    fieldEnd: "2026-05-05",
    sampleSize: 1008,
    hypothesis: "Bardella",
    scores: { bardella: 34, philippe: 18, melenchon: 14, attal: 13 },
  },
  {
    institute: "Ifop-Fiducial",
    sponsor: "Sud Radio · Le Figaro",
    publishedAt: "2026-03-05",
    fieldStart: "2026-03-03",
    fieldEnd: "2026-03-04",
    sampleSize: 1100,
    hypothesis: "Bardella",
    scores: { bardella: 36, philippe: 16, attal: 11, retailleau: 9 },
  },
  {
    institute: "Elabe",
    sponsor: "BFMTV",
    publishedAt: "2026-02-19",
    fieldStart: "2026-02-18",
    fieldEnd: "2026-02-19",
    sampleSize: 1502,
    hypothesis: "Bardella",
    scores: { bardella: 35, philippe: 18, melenchon: 13, attal: 13 },
  },
];

/** Hypothèses de 1er tour (Elabe/EPOC juillet 2026) — [nom, %]. */
export const SEED_HYPOTHESES: {
  label: string;
  note: string;
  results: [string, number][];
}[] = [
  {
    label: "Philippe (centre)",
    note: "Philippe + Glucksmann + Mélenchon — la plus fréquemment testée (Elabe, 9–10 juil 2026).",
    results: [
      ["Le Pen", 35],
      ["Philippe", 16.5],
      ["Mélenchon", 16],
      ["Glucksmann", 10.5],
      ["Retailleau", 8],
      ["Tondelier", 3.5],
      ["Zemmour", 3],
      ["Roussel", 2.5],
    ],
  },
  {
    label: "Attal + Retailleau",
    note: "Centre = Attal, droite = Retailleau ; Mélenchon prend l'ascendant à gauche.",
    results: [
      ["Le Pen", 34],
      ["Mélenchon", 14.5],
      ["Attal", 13.5],
      ["Retailleau", 11],
      ["Glucksmann", 11],
      ["Zemmour", 3.5],
      ["Tondelier", 3.5],
      ["Roussel", 2.5],
    ],
  },
  {
    label: "Philippe + Hollande",
    note: "Une candidature Hollande à gauche rebat les cartes de la qualification.",
    results: [
      ["Le Pen", 35],
      ["Philippe", 19],
      ["Mélenchon", 14.5],
      ["Retailleau", 9],
      ["Hollande", 9],
      ["Ruffin", 6],
      ["Zemmour", 2.5],
      ["Roussel", 2],
    ],
  },
  {
    label: "Attal + Hollande",
    note: "Bloc central sur Attal, gauche sociale-démocrate sur Hollande.",
    results: [
      ["Le Pen", 35.5],
      ["Attal", 15.5],
      ["Mélenchon", 15],
      ["Retailleau", 11],
      ["Hollande", 8],
      ["Glucksmann", 7],
      ["Zemmour", 3],
      ["Tondelier", 3],
    ],
  },
];

/** Duels de 2nd tour (%) — [nomA, valA, nomB, valB], A = camp RN. */
export const SEED_DUELS: [string, number, string, number][] = [
  ["Le Pen", 52, "Philippe", 48],
  ["Le Pen", 56, "Retailleau", 44],
  ["Le Pen", 56, "Attal", 44],
  ["Le Pen", 58.5, "Glucksmann", 41.5],
  ["Le Pen", 66, "Mélenchon", 34],
  ["Bardella", 56.5, "Philippe", 43.5],
];
