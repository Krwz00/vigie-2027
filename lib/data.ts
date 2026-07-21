import type {
  Aggregate,
  CandidateId,
  Duel,
  Hypothesis,
  Kpi,
  Poll,
  VigieData,
} from "./types";
import { CANDIDATES } from "./candidates";
import {
  aggregateSnapshot,
  buildAggregatesFromPolls,
  distinctDates,
} from "./aggregate";
import {
  deriveHypothesisLabel,
  fetchMieuxVoter,
  SOURCE_URL,
  type MVPoll,
} from "./mieuxvoter";

const RECENT_WINDOW_DAYS = 120; // « testée récemment » = 4 derniers mois
const SELECTOR_MAX = 6; // hypothèses proposées dans le sélecteur
const RN: CandidateId[] = ["lepen", "bardella"];

function frDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function candidatesOf(polls: MVPoll[]): CandidateId[] {
  const set = new Set<CandidateId>();
  for (const p of polls) for (const k of Object.keys(p.scores) as CandidateId[]) set.add(k);
  return [...set];
}

/** Choisit l'hypothèse 1er tour la plus fréquemment testée récemment. */
function pickPrincipal(first: MVPoll[], latestDate: string): string {
  const cutoff = new Date(
    new Date(latestDate + "T00:00:00Z").getTime() - RECENT_WINDOW_DAYS * 86400000,
  )
    .toISOString()
    .slice(0, 10);

  const stats = new Map<string, { recent: number; total: number; last: string }>();
  for (const p of first) {
    const s = stats.get(p.hypothesisId) ?? { recent: 0, total: 0, last: "" };
    s.total++;
    if (p.fieldEnd >= cutoff) s.recent++;
    if (p.fieldEnd > s.last) s.last = p.fieldEnd;
    stats.set(p.hypothesisId, s);
  }
  const ranked = [...stats.entries()].sort((a, b) => {
    if (b[1].recent !== a[1].recent) return b[1].recent - a[1].recent;
    if (b[1].last !== a[1].last) return b[1].last > a[1].last ? 1 : -1;
    return a[0] < b[0] ? -1 : 1;
  });
  return ranked[0]?.[0] ?? "";
}

/** Hypothèses 1er tour ordonnées (principal en tête, puis par nb de vagues). */
function orderedHypotheses(first: MVPoll[], principalId: string): string[] {
  const counts = new Map<string, number>();
  for (const p of first) counts.set(p.hypothesisId, (counts.get(p.hypothesisId) ?? 0) + 1);
  const ordered = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  return [principalId, ...ordered.filter((id) => id !== principalId)];
}

function buildSelector(
  first: MVPoll[],
  ids: string[],
  hypComment: Map<string, string>,
): Hypothesis[] {
  const out: Hypothesis[] = [];
  const seenLabels = new Set<string>();

  for (const id of ids) {
    if (out.length >= SELECTOR_MAX) break;
    const polls = first.filter((p) => p.hypothesisId === id);
    if (!polls.length) continue;
    const label = deriveHypothesisLabel(candidatesOf(polls), 1);
    // Dédup : deux hypothèses au même libellé de blocs = même config pour l'UI ;
    // on garde la plus testée (déjà en tête via l'ordre d'entrée).
    if (seenLabels.has(label)) continue;
    const latest = distinctDates(polls).slice(-1)[0];
    const snap = aggregateSnapshot(polls, latest);
    if (!snap.length) continue;
    seenLabels.add(label);
    const comment = hypComment.get(id)?.trim();
    const note =
      comment && comment.length > 2
        ? comment
        : `Configuration testée ${polls.length} fois — dernier terrain ${frDate(latest)}.`;
    out.push({
      id,
      label,
      note,
      n: polls.length,
      results: snap.map((s) => ({
        name: CANDIDATES[s.candidate].last,
        value: s.value,
        color: CANDIDATES[s.candidate].color,
      })),
    });
  }
  return out;
}

function buildDuels(second: MVPoll[]): Duel[] {
  // Regroupe par hypothèse de 2nd tour, prend le sondage le plus récent.
  const byHyp = new Map<string, MVPoll>();
  for (const p of second) {
    const cur = byHyp.get(p.hypothesisId);
    if (!cur || p.fieldEnd > cur.fieldEnd) byHyp.set(p.hypothesisId, p);
  }
  const duels: Duel[] = [];
  for (const p of byHyp.values()) {
    const entries = (Object.entries(p.scores) as [CandidateId, number][])
      .filter(([, v]) => typeof v === "number")
      .sort((a, b) => b[1] - a[1]);
    if (entries.length < 2) continue;
    const rnEntry = entries.find(([id]) => RN.includes(id));
    const a = rnEntry ?? entries[0];
    const b = entries.find(([id]) => id !== a[0]) ?? entries[1];
    duels.push({
      a: { name: CANDIDATES[a[0]].last, value: a[1], color: CANDIDATES[a[0]].color },
      b: { name: CANDIDATES[b[0]].last, value: b[1], color: CANDIDATES[b[0]].color },
    });
  }
  // Duels impliquant le RN d'abord, puis par écart décroissant.
  return duels
    .sort((x, y) => y.a.value - x.a.value)
    .slice(0, 8);
}

/** Fil des sondages : une carte par enquête (dédupliquée des variantes d'hypothèse). */
function buildFeed(first: MVPoll[]): Poll[] {
  const bySurvey = new Map<string, MVPoll>();
  for (const p of first) {
    const stem = p.pollId.replace(/_[^_]+$/, ""); // retire la variante d'hypothèse
    const cur = bySurvey.get(stem);
    if (!cur || Object.keys(p.scores).length > Object.keys(cur.scores).length) {
      bySurvey.set(stem, p);
    }
  }
  const surveys = [...bySurvey.values()].sort((a, b) =>
    a.fieldEnd < b.fieldEnd ? 1 : -1,
  );
  const latest = surveys[0]?.publishedAt ?? "";
  const latestMs = latest ? Date.parse(latest) : 0;
  return surveys.slice(0, 16).map((p) => ({
    institute: p.institute,
    sponsor: p.sponsor,
    publishedAt: p.publishedAt,
    fieldStart: p.fieldStart,
    fieldEnd: p.fieldEnd,
    sampleSize: p.sampleSize,
    hypothesis: deriveHypothesisLabel(Object.keys(p.scores) as CandidateId[], 1),
    scores: p.scores,
    isNew: latestMs - Date.parse(p.publishedAt) < 7 * 86400000,
  }));
}

function buildKpis(
  aggregates: Aggregate[],
  waves: number,
  duels: Duel[],
): Kpi[] {
  const ranked = [...aggregates].sort((a, b) => b.current - a.current);
  const leader = ranked[0];
  const second = ranked[1];
  const gap = leader && second ? leader.current - second.current : 0;
  const rnWins = duels.filter((d) => d.a.value > d.b.value);
  const rnCeiling = rnWins.length ? Math.max(...rnWins.map((d) => d.a.value)) : 0;

  return [
    {
      label: "Leader 1er tour",
      value: leader ? CANDIDATES[leader.candidate].last : "—",
      sub: leader ? `${leader.current.toFixed(1)} % · agrégé` : "—",
      accent: true,
    },
    {
      label: "Écart leader / 2e",
      value: `+${gap.toFixed(1)} pt`,
      sub: second ? `devant ${CANDIDATES[second.candidate].last}` : "—",
    },
    {
      label: "Vagues agrégées",
      value: String(waves),
      sub: "sur 4 semaines glissantes",
    },
    {
      label: "Plafond RN · 2nd tour",
      value: rnCeiling ? `${rnCeiling.toFixed(1)} %` : "—",
      sub: "meilleure hypothèse de duel",
    },
  ];
}

function unavailable(reason: string): VigieData {
  return {
    status: "unavailable",
    updatedAt: new Date(Date.now()).toISOString(),
    source: "mieuxvoter",
    sourceUrl: SOURCE_URL,
    latestPollDate: null,
    principalLabel: reason,
    milestones: [],
    aggregates: [],
    polls: [],
    hypotheses: [],
    duels: [],
    kpis: [],
    wavesCount: 0,
    unmapped: [],
  };
}

/**
 * Assemble la charge servie à l'UI depuis la source réelle MieuxVoter.
 * En cas d'échec réseau : état « indisponible » honnête, aucun chiffre fabriqué.
 */
export async function getVigieData(): Promise<VigieData> {
  const mv = await fetchMieuxVoter();
  if (!mv || mv.first.length === 0 || !mv.latestDate) {
    return unavailable("Données momentanément indisponibles");
  }

  // 1er tour — hypothèse principale (la plus testée récemment).
  const principalId = pickPrincipal(mv.first, mv.latestDate);
  const principalPolls = mv.first.filter((p) => p.hypothesisId === principalId);

  const dates = distinctDates(principalPolls);
  const labels = dates.map(frDate);
  const aggregates = buildAggregatesFromPolls(principalPolls, dates, labels);
  const principalLabel = deriveHypothesisLabel(candidatesOf(principalPolls), 1);

  // Sélecteur d'hypothèses (dédupliqué par libellé) + duels de 2nd tour.
  const selectorIds = orderedHypotheses(mv.first, principalId);
  const hypotheses = buildSelector(mv.first, selectorIds, mv.hypComment);
  const duels = buildDuels(mv.second);

  return {
    status: "available",
    updatedAt: new Date(Date.now()).toISOString(),
    source: "mieuxvoter",
    sourceUrl: SOURCE_URL,
    latestPollDate: mv.latestDate,
    principalLabel,
    milestones: labels,
    aggregates,
    polls: buildFeed(mv.first),
    hypotheses,
    duels,
    kpis: buildKpis(aggregates, mv.count, duels),
    wavesCount: mv.count,
    unmapped: mv.unmapped,
  };
}
