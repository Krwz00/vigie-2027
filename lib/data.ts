import type {
  CandidateId,
  Duel,
  Hypothesis,
  Poll,
  Source,
  VigieData,
} from "./types";
import { CANDIDATES } from "./candidates";
import {
  aggregateSnapshot,
  buildAggregatesFromPolls,
  distinctDates,
  duelAggregate,
} from "./aggregate";
import {
  deriveHypothesisLabel,
  fetchWikipedia,
  WIKI_ARTICLE_URL,
  type WikiPoll,
} from "./wikipedia";

const RN: CandidateId[] = ["lepen", "bardella"];

function frDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function candidatesOf(polls: WikiPoll[]): CandidateId[] {
  const set = new Set<CandidateId>();
  for (const p of polls) for (const k of Object.keys(p.scores) as CandidateId[]) set.add(k);
  return [...set];
}

/**
 * Traçabilité d'une agrégation : pour un lot de sondages, qui (institut) a testé
 * et à quelles dates. Instituts ordonnés du terrain le plus récent au plus ancien ;
 * dates idem. Toute agrégation de l'app expose ces sources.
 */
function sourcesOf(polls: WikiPoll[]): Source[] {
  const byInst = new Map<string, Set<string>>();
  for (const p of polls) {
    const s = byInst.get(p.institute) ?? new Set<string>();
    s.add(p.fieldEnd);
    byInst.set(p.institute, s);
  }
  return [...byInst.entries()]
    .map(([institute, ds]) => {
      const sorted = [...ds].sort((a, b) => (a < b ? 1 : -1)); // récent → ancien
      return { institute, dates: sorted.map(frDate).join(", "), last: sorted[0] };
    })
    .sort((a, b) => (a.last < b.last ? 1 : -1))
    .map(({ institute, dates }) => ({ institute, dates }));
}

/**
 * Repère calculé depuis le baromètre (jamais codé en dur) : candidat en tête,
 * dauphin, et score agrégé par candidat. Sert à trier hypothèses et duels par
 * pertinence — si le corpus change, l'ordre suit automatiquement.
 */
interface Barometer {
  leader: CandidateId | null;
  second: CandidateId | null;
  score: (id: CandidateId) => number;
}

/**
 * TOUTES les hypothèses de 1er tour réellement sondées (≥ 2 vagues), libellé
 * lisible, barres agrégées À L'INTÉRIEUR de la config (aucun score emprunté) et
 * instituts/dates sources. Tri par PERTINENCE calculée : (1) contient le candidat
 * en tête du baromètre, (2) somme des scores agrégés des candidats présents,
 * (3) fraîcheur (dernier terrain).
 */
function buildAllHypotheses(first: WikiPoll[], bar: Barometer): Hypothesis[] {
  const byId = new Map<string, WikiPoll[]>();
  for (const p of first) {
    const a = byId.get(p.hypothesisId) ?? [];
    a.push(p);
    byId.set(p.hypothesisId, a);
  }
  const out: { hyp: Hypothesis; ids: CandidateId[]; latest: string }[] = [];
  for (const [id, polls] of byId) {
    const latest = distinctDates(polls).slice(-1)[0];
    const snap = aggregateSnapshot(polls, latest);
    if (!snap.length || polls.length < 2) continue; // ≥ 2 vagues
    const ids = candidatesOf(polls);
    out.push({
      ids,
      latest,
      hyp: {
        id,
        label: deriveHypothesisLabel(ids, 1),
        n: polls.length,
        results: snap.map((s) => ({
          name: CANDIDATES[s.candidate].last,
          value: s.value,
          color: CANDIDATES[s.candidate].color,
        })),
        sources: sourcesOf(polls),
      },
    });
  }
  const sum = (ids: CandidateId[]) => ids.reduce((s, id) => s + bar.score(id), 0);
  out.sort((a, b) => {
    const al = bar.leader && a.ids.includes(bar.leader) ? 1 : 0;
    const bl = bar.leader && b.ids.includes(bar.leader) ? 1 : 0;
    if (al !== bl) return bl - al;
    const as = sum(a.ids), bs = sum(b.ids);
    if (Math.abs(as - bs) > 1e-6) return bs - as;
    if (a.latest !== b.latest) return a.latest < b.latest ? 1 : -1;
    return b.hyp.n - a.hyp.n;
  });
  return out.map((o) => o.hyp);
}

/**
 * TOUS les duels de 2nd tour, agrégés (moyenne pondérée par institut) + sources.
 * Le candidat en TÊTE du duel est toujours à gauche (recalculé par duel depuis
 * les scores). Tri par PERTINENCE calculée : (1) duel opposant les deux mieux
 * placés du baromètre, (2) somme des scores agrégés des protagonistes,
 * (3) fraîcheur.
 */
function buildAllDuels(second: WikiPoll[], bar: Barometer): Duel[] {
  const byId = new Map<string, WikiPoll[]>();
  for (const p of second) {
    const a = byId.get(p.hypothesisId) ?? [];
    a.push(p);
    byId.set(p.hypothesisId, a);
  }
  const items: { duel: Duel; ids: CandidateId[]; latest: string }[] = [];
  for (const [, polls] of byId) {
    const ids = [
      ...new Set(polls.flatMap((p) => Object.keys(p.scores) as CandidateId[])),
    ];
    if (ids.length < 2) continue;
    // Filtre : on exclut les duels d'avant 2025 testés une seule fois (un duel
    // d'avant 2025 avec 2+ occurrences reste affiché).
    const latest = polls.reduce((m, p) => (p.fieldEnd > m ? p.fieldEnd : m), "");
    if (polls.length === 1 && latest < "2025-01-01") continue;
    const [id0, id1] = ids;
    const v0 = duelAggregate(polls, id0);
    const v1 = duelAggregate(polls, id1);
    if (v0 == null || v1 == null) continue;
    // En tête du duel → à gauche (côté a).
    const [idA, vA, idB, vB] = v0 >= v1 ? [id0, v0, id1, v1] : [id1, v1, id0, v0];
    items.push({
      ids: [idA, idB],
      latest,
      duel: {
        a: { name: CANDIDATES[idA].last, value: vA, color: CANDIDATES[idA].color },
        b: { name: CANDIDATES[idB].last, value: vB, color: CANDIDATES[idB].color },
        n: polls.length,
        sources: sourcesOf(polls),
      },
    });
  }
  const isTopPair = (ids: CandidateId[]) =>
    bar.leader != null && bar.second != null &&
    ids.includes(bar.leader) && ids.includes(bar.second);
  items.sort((x, y) => {
    const xt = isTopPair(x.ids) ? 1 : 0, yt = isTopPair(y.ids) ? 1 : 0;
    if (xt !== yt) return yt - xt;
    const xs = bar.score(x.ids[0]) + bar.score(x.ids[1]);
    const ys = bar.score(y.ids[0]) + bar.score(y.ids[1]);
    if (Math.abs(xs - ys) > 1e-6) return ys - xs;
    if (x.latest !== y.latest) return x.latest < y.latest ? 1 : -1;
    return y.duel.a.value - x.duel.a.value;
  });
  return items.map((i) => i.duel);
}

/** Fil des sondages : une carte par enquête (dédupliquée des variantes d'hypothèse). */
function buildFeed(first: WikiPoll[]): Poll[] {
  const bySurvey = new Map<string, WikiPoll>();
  for (const p of first) {
    // une enquête = institut + date de fin ; on garde l'hypothèse la plus complète
    const stem = `${p.institute}|${p.fieldEnd}`;
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
  return surveys.slice(0, 40).map((p) => ({
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

function unavailable(reason: string): VigieData {
  return {
    status: "unavailable",
    partial: false,
    updatedAt: new Date(Date.now()).toISOString(),
    source: "wikipedia",
    sourceUrl: WIKI_ARTICLE_URL,
    latestPollDate: null,
    lastPollInstitute: null,
    lastPollDates: null,
    principalLabel: reason,
    milestones: [],
    milestoneDates: [],
    aggregates: [],
    barometerPolls: [],
    institutes: [],
    polls: [],
    hypotheses: [],
    duels: [],
    wavesCount: 0,
    unmapped: [],
  };
}

/**
 * Assemble la charge servie à l'UI depuis Wikipédia (CC BY-SA).
 * En cas d'échec réseau : état « indisponible » honnête, aucun chiffre fabriqué.
 */
export async function getVigieData(): Promise<VigieData> {
  const wp = await fetchWikipedia();
  if (!wp || wp.first.length === 0 || !wp.latestDate) {
    return unavailable("Données momentanément indisponibles");
  }

  // Baromètre « vue de dynamique » : TOUS les candidats sondés, chacun à sa
  // moyenne toutes hypothèses confondues (moyenne mobile pondérée 40/30/20/10
  // dans le temps, moyennée à travers les configs de chaque vague), échantillonnée
  // sur la timeline globale des terrains de 1er tour. Un candidat non testé sur
  // une période reste null (pointillé/absence) — jamais un score emprunté.
  const dates = distinctDates(wp.first);
  const labels = dates.map(frDate);
  // Fenêtre de fraîcheur ancrée sur aujourd'hui (minuit UTC) : un candidat sans
  // sondage récent est marqué « daté » et relégué au classement.
  const todayMs = Math.floor(Date.now() / 86400000) * 86400000;
  const aggregates = buildAggregatesFromPolls(wp.first, dates, labels, todayMs);

  // Vagues brutes 1er tour (filtre par institut du baromètre, calculé côté
  // client) + instituts réellement présents, ordonnés par nombre de vagues puis
  // récence. Le filtre institut reste borné à la moyenne de cet institut.
  const barometerPolls: Poll[] = wp.first.map((p) => ({
    institute: p.institute,
    sponsor: p.sponsor,
    publishedAt: p.publishedAt,
    fieldStart: p.fieldStart,
    fieldEnd: p.fieldEnd,
    sampleSize: p.sampleSize,
    hypothesis: p.hypothesis,
    scores: p.scores,
  }));
  const instStats = new Map<string, { n: number; last: string }>();
  for (const p of wp.first) {
    const s = instStats.get(p.institute) ?? { n: 0, last: "" };
    s.n++;
    if (p.fieldEnd > s.last) s.last = p.fieldEnd;
    instStats.set(p.institute, s);
  }
  const institutes = [...instStats.entries()]
    .sort((a, b) => (b[1].n !== a[1].n ? b[1].n - a[1].n : b[1].last > a[1].last ? 1 : -1))
    .map(([name]) => name);

  // Repère baromètre (calculé, jamais codé en dur) : tête + dauphin (candidats
  // à jour d'abord, par score décroissant) et score agrégé par candidat. Pilote
  // le tri par pertinence des hypothèses et des duels.
  const rankedAgg = [...aggregates].sort((a, b) =>
    a.stale !== b.stale ? (a.stale ? 1 : -1) : b.current - a.current,
  );
  const scoreMap = new Map<CandidateId, number>(
    aggregates.map((a) => [a.candidate, a.current]),
  );
  const bar: Barometer = {
    leader: rankedAgg[0]?.candidate ?? null,
    second: rankedAgg[1]?.candidate ?? null,
    score: (id) => scoreMap.get(id) ?? 0,
  };

  const hypotheses = buildAllHypotheses(wp.first, bar);
  const duels = buildAllDuels(wp.second, bar);

  return {
    status: "available",
    partial: wp.partial,
    updatedAt: new Date(Date.now()).toISOString(),
    source: "wikipedia",
    sourceUrl: WIKI_ARTICLE_URL,
    latestPollDate: wp.latestDate,
    lastPollInstitute: wp.lastPoll?.institute ?? null,
    lastPollDates: wp.lastPoll?.dates ?? null,
    principalLabel: "tous candidats · toutes hypothèses",
    milestones: labels,
    milestoneDates: dates,
    aggregates,
    barometerPolls,
    institutes,
    polls: buildFeed(wp.first),
    hypotheses,
    duels,
    wavesCount: wp.count,
    unmapped: wp.unmapped,
  };
}
