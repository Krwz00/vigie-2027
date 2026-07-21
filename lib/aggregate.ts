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
 * Valeur agrégée d'un candidat à une date `asOf`, sur la fenêtre glissante.
 * 1) filtre les sondages dont la fin de terrain tombe dans [asOf-28j, asOf]
 * 2) par institut : pondère ses vagues 40/30/20/10
 * 3) moyenne inter-instituts
 * Renvoie null si aucun sondage ne mesure ce candidat sur la fenêtre.
 */
export function aggregateAt(
  polls: Poll[],
  candidate: CandidateId,
  asOf: number,
): number | null {
  const lo = asOf - WINDOW_DAYS * 86400000;
  const inWindow = polls.filter((p) => {
    const t = pollDate(p);
    return (
      t <= asOf &&
      t >= lo &&
      typeof p.scores[candidate] === "number"
    );
  });
  if (inWindow.length === 0) return null;

  const byInstitute = new Map<string, number[]>();
  for (const p of inWindow) {
    const arr = byInstitute.get(p.institute) ?? [];
    arr.push({ t: pollDate(p), v: p.scores[candidate] as number } as never);
    byInstitute.set(p.institute, arr);
  }

  const perInstitute: number[] = [];
  for (const [, raw] of byInstitute) {
    const waves = (raw as unknown as { t: number; v: number }[])
      .sort((a, b) => b.t - a.t)
      .map((x) => x.v);
    perInstitute.push(weightWaves(waves));
  }

  return perInstitute.reduce((a, b) => a + b, 0) / perInstitute.length;
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

/** Dates de fin d'enquête distinctes d'un lot, triées croissant. */
export function distinctDates(polls: Poll[]): string[] {
  const set = new Set<string>();
  for (const p of polls) if (p.fieldEnd) set.add(p.fieldEnd);
  return [...set].sort();
}
