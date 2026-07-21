export type CandidateId =
  // 12 candidats de la maquette (couleurs d'origine)
  | "lepen"
  | "bardella"
  | "philippe"
  | "melenchon"
  | "attal"
  | "glucksmann"
  | "retailleau"
  | "darmanin"
  | "zemmour"
  | "tondelier"
  | "roussel"
  | "dupontaignan"
  // candidats supplémentaires réellement présents dans le dépôt MieuxVoter
  | "hollande"
  | "ruffin"
  | "villepin"
  | "bayrou"
  | "bertrand"
  | "faure"
  | "wauquiez"
  | "lisnard"
  | "lecornu"
  | "knafo"
  | "arthaud"
  | "poutou"
  | "devilliers";

export interface Candidate {
  id: CandidateId;
  last: string; // nom d'usage (Le Pen, Bardella…)
  name: string; // prénom + nom
  party: string;
  mono: string; // monogramme affiché dans les pastilles
  color: string;
  photo?: string; // /candidates/<id>.jpg — fallback monogramme si absent
}

export interface SeriesPoint {
  date: string; // échéance (ex. "Juil 26")
  value: number | null; // null avant entrée du candidat dans les sondages
}

export interface Aggregate {
  candidate: CandidateId;
  series: SeriesPoint[];
  current: number; // dernière valeur agrégée
  delta: number; // écart vs échéance précédente
}

export interface Poll {
  institute: string;
  sponsor: string;
  publishedAt: string; // ISO
  fieldStart: string;
  fieldEnd: string;
  sampleSize: number;
  hypothesis: string;
  scores: Partial<Record<CandidateId, number>>;
  isNew?: boolean;
}

export interface HypothesisResult {
  name: string;
  value: number;
  color: string;
}

export interface Hypothesis {
  id: string; // id_hypothese du dépôt (H41…) — jamais affiché brut
  label: string; // libellé lisible dérivé
  note: string;
  n: number; // nombre de vagues testant cette hypothèse
  results: HypothesisResult[];
}

export interface DuelSide {
  name: string;
  value: number;
  color: string;
}

export interface Duel {
  a: DuelSide; // camp RN (Le Pen / Bardella)
  b: DuelSide; // adversaire
}

export interface Kpi {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}

/** Charge complète servie à l'UI. */
export interface VigieData {
  status: "available" | "unavailable"; // pas de fausse donnée si la source échoue
  partial: boolean; // trop de lignes non parsées → données partielles
  updatedAt: string; // ISO de la dernière agrégation (= « données à jour au »)
  source: "wikipedia"; // source réelle unique en prod
  sourceUrl: string;
  latestPollDate: string | null; // fin d'enquête la plus récente
  lastPollInstitute: string | null; // « Dernier sondage : <institut> »
  lastPollDates: string | null; // « … <dates> »
  principalLabel: string; // hypothèse principale affichée sur la courbe
  milestones: string[]; // échéances de l'axe X
  aggregates: Aggregate[];
  polls: Poll[];
  hypotheses: Hypothesis[];
  duels: Duel[];
  kpis: Kpi[];
  wavesCount: number; // nb de vagues (sondages) agrégées
  unmapped: string[]; // candidate_id du dépôt non rattachés
}
