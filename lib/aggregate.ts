import type {
  Aggregate,
  CandidateId,
  Poll,
  SeriesPoint,
} from "./types";
import { CANDIDATE_ORDER } from "./candidates";

/**
 * Moteur d'agrégation VIGIE 2027.
 *
 * Règle : moyenne mobile pondérée sur 4 semaines glissantes, tous instituts
 * confondus, pondération 40 / 30 / 20 / 10 du plus récent au plus ancien —
 * d'abord *par institut* (les vagues d'un même institut sont pondérées entre
 * elles), puis *moyenne inter-instituts* de ces valeurs. On ne lisse jamais
 * des hypothèses de configuration différentes sur une même courbe : les
 * sondages sont donc regroupés par famille d'hypothèse en amont.
 */

const WEIGHTS = [0.4, 0.3, 0.2, 0.1];
const WINDOW_DAYS = 28; // 4 semaines glissantes

function toTime(iso: string): number {
  // Date déterministe (pas de Date.now dans le pipeline) : parse ISO -> ms.
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

/** Date de référence d'un sondage = fin de terrain (fallback publishedAt). */
function pollDate(p: Poll): number {
  return toTime(p.fieldEnd || p.publishedAt);
}

/**
 * Pondère jusqu'à 4 vagues (les plus récentes) avec 40/30/20/10.
 * Renormalise si moins de 4 vagues sont disponibles.
 */
function weightWaves(values: number[]): number {
  const recent = values.slice(0, 4); // déjà triées du + récent au + ancien
  const w = WEIGHTS.slice(0, recent.length);
  const wSum = w.reduce((a, b) => a + b, 0);
  const acc = recent.reduce((a, v, i) => a + v * w[i], 0);
  return acc / wSum;
}

/**
 * Cœur d'agrégation d'un candidat sur un lot de sondages DÉJÀ filtré (fenêtre,
 * hypothèse, duel… selon l'appelant). Ne mélange jamais les instituts au mauvais
 * niveau :
 * 1) par institut, on regroupe ses vagues par date de terrain, et pour une même
 *    date on prend la MOYENNE du candidat à travers les configs testées ce jour-là
 *    (« moyennée à travers les configs de chaque vague ») ;
 * 2) on pondère les vagues datées de l'institut 40/30/20/10 (du + récent au + ancien) ;
 * 3) moyenne inter-instituts.
 * Un candidat non mesuré → jamais un score emprunté : il est simplement absent du
 * lot et renvoie null.
 */
function instituteWeighted(polls: Poll[], candidate: CandidateId): number | null {
  const byInstitute = new Map<string, Map<string, number[]>>();
  for (const p of polls) {
    const v = p.scores[candidate];
    if (typeof v !== "number") continue;
    let dated = byInstitute.get(p.institute);
    if (!dated) {
      dated = new Map();
      byInstitute.set(p.institute, dated);
    }
    const key = p.fieldEnd || p.publishedAt;
    const arr = dated.get(key) ?? [];
    arr.push(v);
    dated.set(key, arr);
  }
  if (byInstitute.size === 0) return null;

  const perInstitute: number[] = [];
  for (const [, dated] of byInstitute) {
    const waves = [...dated.entries()]
      .map(([d, vals]) => ({
        t: toTime(d),
        v: vals.reduce((a, b) => a + b, 0) / vals.length, // moyenne inter-configs du jour
      }))
      .sort((a, b) => b.t - a.t)
      .map((x) => x.v);
    perInstitute.push(weightWaves(waves));
  }
  return perInstitute.reduce((a, b) => a + b, 0) / perInstitute.length;
}

/**
 * Valeur agrégée d'un candidat à une date `asOf`, sur la fenêtre glissante de
 * 28 jours : filtre [asOf-28j, asOf] puis {@link instituteWeighted}. Renvoie null
 * si aucun sondage ne mesure ce candidat sur la fenêtre.
 */
export function aggregateAt(
  polls: Poll[],
  candidate: CandidateId,
  asOf: number,
): number | null {
  const lo = asOf - WINDOW_DAYS * 86400000;
  const inWindow = polls.filter((p) => {
    const t = pollDate(p);
    return t <= asOf && t >= lo && typeof p.scores[candidate] === "number";
  });
  if (inWindow.length === 0) return null;
  return instituteWeighted(inWindow, candidate);
}

/**
 * Agrégat d'un candidat dans un duel de 2nd tour : {@link instituteWeighted} sur
 * TOUTES les vagues du duel (pas de fenêtre — les duels sont épars dans le temps),
 * la pondération 40/30/20/10 par institut privilégiant naturellement le récent.
 */
export function duelAggregate(polls: Poll[], candidate: CandidateId): number | null {
  return round1(instituteWeighted(polls, candidate));
}

/**
 * Construit les séries agrégées à partir de sondages bruts, par hypothèse.
 * `dates` = ancres temporelles (ISO) auxquelles on échantillonne la fenêtre.
 * `labels` = étiquettes d'axe correspondantes.
 */
export function buildAggregatesFromPolls(
  polls: Poll[],
  dates: string[],
  labels: string[],
): Aggregate[] {
  const anchors = dates.map(toTime);

  return CANDIDATE_ORDER.map((candidate) => {
    const series: SeriesPoint[] = anchors.map((asOf, i) => ({
      date: labels[i],
      value: round1(aggregateAt(polls, candidate, asOf)),
    }));
    return finalizeAggregate(candidate, series);
  }).filter((agg) => agg.series.some((p) => p.value != null));
}

/**
 * Chemin de repli : construit les agrégats depuis des séries déjà lissées
 * (SEED_SERIES). Calcule current + delta.
 */
export function buildAggregatesFromSeries(
  series: Partial<Record<CandidateId, (number | null)[]>>,
  labels: string[],
): Aggregate[] {
  return CANDIDATE_ORDER.map((candidate) => {
    const raw = series[candidate] ?? [];
    const points: SeriesPoint[] = labels.map((date, i) => ({
      date,
      value: raw[i] ?? null,
    }));
    return finalizeAggregate(candidate, points);
  });
}

function finalizeAggregate(
  candidate: CandidateId,
  series: SeriesPoint[],
): Aggregate {
  const vals = series.map((p) => p.value).filter((v): v is number => v != null);
  const current = vals.length ? vals[vals.length - 1] : 0;
  const prev = vals.length > 1 ? vals[vals.length - 2] : current;
  return {
    candidate,
    series,
    current: round1(current) ?? 0,
    delta: round1(current - prev) ?? 0,
  };
}

function round1(v: number | null): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return Math.round(v * 10) / 10;
}

/** Nombre de vagues (sondages) réellement agrégées. */
export function countWaves(polls: Poll[]): number {
  return polls.length;
}

/** ISO (YYYY-MM-DD) → ms UTC. */
export function isoToMs(iso: string): number {
  return toTime(iso);
}

/**
 * Snapshot agrégé d'un lot de sondages homogène (même hypothèse) à la date
 * `asOfISO` : moyenne mobile pondérée 40/30/20/10 sur 4 semaines glissantes,
 * par candidat présent. Sert au sélecteur d'hypothèses et aux duels.
 */
export function aggregateSnapshot(
  polls: Poll[],
  asOfISO: string,
): { candidate: CandidateId; value: number }[] {
  const asOf = toTime(asOfISO);
  const present = new Set<CandidateId>();
  for (const p of polls) {
    for (const k of Object.keys(p.scores) as CandidateId[]) present.add(k);
  }
  const out: { candidate: CandidateId; value: number }[] = [];
  for (const candidate of CANDIDATE_ORDER) {
    if (!present.has(candidate)) continue;
    const v = aggregateAt(polls, candidate, asOf);
    if (v != null) out.push({ candidate, value: round1(v) as number });
  }
  return out.sort((a, b) => b.value - a.value);
}

/**
 * Série BRUTE d'un institut au sein d'une config homogène : à chaque date
 * d'ancrage, la valeur de la vague de cet institut qui s'y termine, sinon null.
 * Aucune pondération inter-instituts, aucune moyenne mobile — les mesures
 * réelles de cet institut, telles quelles. Sert au mode « institut unique » :
 * si l'institut n'a qu'une ou deux vagues, on obtient des points isolés (le
 * rendu n'inventera pas de courbe lissée trompeuse). Un candidat non mesuré
 * par cet institut reste null : jamais un score emprunté à un autre institut.
 */
export function buildRawInstituteSeries(
  polls: Poll[],
  institute: string,
  dates: string[],
  labels: string[],
): Aggregate[] {
  const inst = polls.filter((p) => p.institute === institute);
  return CANDIDATE_ORDER.map((candidate) => {
    const series: SeriesPoint[] = dates.map((d, i) => {
      // À cette date, moyenne du candidat sur les configs testées par CET institut
      // ce jour-là (aucune pondération inter-instituts : c'est la mesure brute de
      // l'institut). Aucune valeur empruntée à un autre institut.
      const vals = inst
        .filter((p) => p.fieldEnd === d && typeof p.scores[candidate] === "number")
        .map((p) => p.scores[candidate] as number);
      return {
        date: labels[i],
        value: vals.length ? round1(vals.reduce((a, b) => a + b, 0) / vals.length) : null,
      };
    });
    return finalizeAggregate(candidate, series);
  }).filter((agg) => agg.series.some((p) => p.value != null));
}

/** Dates de fin d'enquête distinctes d'un lot, triées croissant. */
export function distinctDates(polls: Poll[]): string[] {
  const set = new Set<string>();
  for (const p of polls) if (p.fieldEnd) set.add(p.fieldEnd);
  return [...set].sort();
}
