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

/** Traçabilité d'une agrégation : quel institut, à quelles dates. */
export interface Source {
  institute: string;
  dates: string; // dates de terrain lisibles, séparées par des virgules
}

export interface Hypothesis {
  id: string; // clé de configuration (liste triée des candidats) — jamais affichée brute
  label: string; // libellé lisible dérivé
  n: number; // nombre de vagues testant cette hypothèse
  results: HypothesisResult[];
  sources: Source[]; // instituts + dates ayant testé cette hypothèse
}

export interface DuelSide {
  name: string;
  value: number;
  color: string;
}

export interface Duel {
  a: DuelSide; // camp RN (Le Pen / Bardella)
  b: DuelSide; // adversaire
  n: number; // nombre de vagues agrégées
  sources: Source[]; // instituts + dates ayant testé ce duel
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
  principalLabel: string; // libellé de la vue baromètre (« vue de dynamique »)
  milestones: string[]; // libellés de l'axe X
  milestoneDates: string[]; // dates ISO des ancres (parallèle à `milestones`)
  aggregates: Aggregate[]; // TOUS les candidats, moyenne toutes hypothèses
  barometerPolls: Poll[]; // toutes les vagues 1er tour (filtre institut du baromètre)
  institutes: string[]; // instituts présents dans les données 1er tour
  polls: Poll[];
  hypotheses: Hypothesis[];
  duels: Duel[];
  wavesCount: number; // nb de vagues (sondages) agrégées
  unmapped: string[]; // candidate_id du dépôt non rattachés
}
