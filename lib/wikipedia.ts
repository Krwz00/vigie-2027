import type { CandidateId, Poll } from "./types";
import { CANDIDATES, resolveCandidateId } from "./candidates";

/**
 * Connecteur Wikipédia (source libre, CC BY-SA 4.0).
 * Article : « Liste de sondages sur l'élection présidentielle française de 2027 ».
 * On récupère le WIKITEXT brut via l'API MediaWiki (pas le HTML rendu) et on le
 * parse défensivement : toute ligne non exploitable est loguée, jamais un crash ;
 * au-delà d'un seuil de lignes perdues on bascule en « données partielles ».
 */

const ARTICLE = "Liste de sondages sur l'élection présidentielle française de 2027";
export const WIKI_ARTICLE_URL =
  "https://fr.wikipedia.org/wiki/Liste_de_sondages_sur_l%27%C3%A9lection_pr%C3%A9sidentielle_fran%C3%A7aise_de_2027";
export const WIKI_MAIN_URL =
  "https://fr.wikipedia.org/wiki/%C3%89lection_pr%C3%A9sidentielle_fran%C3%A7aise_de_2027";

// Sections 1er tour à parser. L'axe temporel doit couvrir janvier 2025 → dernier
// sondage : on lit donc aussi « === Année 2025 === » (une seule table, colonnes
// génériques PS/ENS/LR/RN réassignées par cellule au vrai candidat via <small>).
// On ne remonte PAS à 2024.
const FIRST_SECTIONS = [
  { heading: "==== Second semestre 2026 ====", year: 2026 },
  { heading: "==== Premier semestre 2026 ====", year: 2026 },
  { heading: "=== Année 2025 ===", year: 2025 },
];

const UNPARSED_THRESHOLD = 0.25; // >25 % de lignes perdues → données partielles

export interface WikiPoll extends Poll {
  hypothesisId: string; // clé de configuration (liste triée des candidats)
  round: 1 | 2;
}

export interface WikiData {
  first: WikiPoll[];
  second: WikiPoll[];
  latestDate: string | null;
  lastPoll: { institute: string; dates: string } | null;
  unmapped: string[];
  count: number;
  partial: boolean;
  unparsedRatio: number;
}

// ───────────────────────── wikitext utils ─────────────────────────

function sectionBody(text: string, heading: string): string | null {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) return null;
  const level = (heading.match(/^=+/) as RegExpMatchArray)[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(=+)[^=].*=+\s*$/);
    if (m && m[1].length <= level) { end = i; break; }
  }
  return lines.slice(start + 1, end).join("\n");
}

function firstTable(body: string): string | null {
  const s = body.indexOf("{|");
  if (s < 0) return null;
  const e = body.indexOf("\n|}", s);
  return body.slice(s, e < 0 ? undefined : e);
}

function rowSegments(table: string): string[] {
  const segs: string[][] = [];
  let cur: string[] = [];
  for (const l of table.split("\n")) {
    if (/^\|-/.test(l)) { segs.push(cur); cur = []; }
    else cur.push(l);
  }
  segs.push(cur);
  return segs.map((s) => s.join("\n"));
}

function cellLines(seg: string, marker: "|" | "!"): string[] {
  const out: string[] = [];
  for (const l of seg.split("\n")) {
    if (marker === "!" && /^!/.test(l)) out.push(l.replace(/^!/, ""));
    if (marker === "|" && /^\|(?![-}+])/.test(l)) out.push(l.replace(/^\|/, ""));
  }
  return out;
}

function headerCandidate(cell: string): { short: string } | null {
  const m = cell.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  if (!m) return null;
  if (/^(Fichier|File|Image):/i.test(m[1].trim())) return null;
  return { short: (m[2] || m[1]).trim() };
}

/** Nettoie un nom de candidat (déballe {{blanc|X}}, retire templates/liens/refs). */
function cleanName(s: string): string {
  return s
    .replace(/\{\{blanc\|([^}]*)\}\}/gi, "$1")
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/'''/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[[\]]/g, "")
    .trim();
}

/** Extrait la valeur d'une cellule + un éventuel candidat de réassignation. */
function parseValueCell(raw: string): { value: number | null; reassign: string | null } {
  let s = raw;
  let reassign: string | null = null;
  const sm = s.match(/<small>([\s\S]*?)<\/small>/);
  if (sm) {
    const lm = sm[1].match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    // display (m[2]) = surnom court ; sinon la cible du lien (m[1])
    if (lm) reassign = cleanName(lm[2] || lm[1]) || cleanName(lm[1]);
    else {
      const bm = cleanName(sm[1]);
      if (bm) reassign = bm;
    }
  }
  // Retire d'abord les attributs de cellule (colspan/rowspan/style/width…) sinon
  // leurs chiffres (ex. colspan="2" dans les tables 2025) sont pris pour la valeur.
  s = s.replace(
    /\b(?:colspan|rowspan|style|width|align|scope|class|bgcolor)\s*=\s*("[^"]*"|'[^']*'|[^\s|]+)/gi,
    " ",
  );
  s = s.replace(/\{\{blanc\|([^}]*)\}\}/gi, "$1");
  s = s.replace(/\{\{Infobox[^}]*couleurs\|[^}]*\}\}/gi, " ");
  s = s.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "").replace(/<ref[^>]*\/>/gi, "");
  s = s.replace(/<small>[\s\S]*?<\/small>/gi, "").replace(/<[^>]+>/g, "");
  s = s.replace(/'''/g, "").replace(/\|/g, " ").trim();
  if (/^(—|-|–|\?|nd|n\/a)?$/i.test(s)) return { value: null, reassign };
  const nm = s.match(/(\d+(?:[.,]\d+)?)/);
  const value = nm ? parseFloat(nm[1].replace(",", ".")) : null;
  return { value, reassign };
}

const MONTHS: Record<string, number> = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12,
};

function pad(n: number): string { return String(n).padStart(2, "0"); }

/** Parse une plage de dates FR ("9-10 juillet", "25 - 27 mai 2026", "28 juin - 1 juillet"). */
function parseDates(raw: string, defaultYear: number): { start: string; end: string } | null {
  let s = raw.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").toLowerCase().trim();
  // retire un éventuel rowspan résiduel ("rowspan="6" | ...")
  s = s.replace(/rowspan\s*=\s*"?\d+"?/g, " ");
  const yearM = s.match(/\b(20\d\d)\b/);
  const year = yearM ? parseInt(yearM[1], 10) : defaultYear;
  s = s.replace(/\b20\d\d\b/g, " "); // évite que les chiffres de l'année soient pris pour des jours
  const monthNames = Object.keys(MONTHS).join("|");
  const tokens = [...s.matchAll(new RegExp(`(\\d{1,2})(?:er)?(?:\\s+(${monthNames}))?`, "g"))]
    .map((m) => ({ day: parseInt(m[1], 10), month: m[2] ? MONTHS[m[2]] : null }))
    .filter((t) => t.day >= 1 && t.day <= 31);
  if (!tokens.length) return null;
  const monthsSeen = tokens.map((t) => t.month).filter((m): m is number => m != null);
  const lastMonth = monthsSeen[monthsSeen.length - 1] ?? null;
  if (lastMonth == null) return null;
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  const startMonth = first.month ?? lastMonth;
  const endMonth = last.month ?? lastMonth;
  return {
    start: `${year}-${pad(startMonth)}-${pad(first.day)}`,
    end: `${year}-${pad(endMonth)}-${pad(last.day)}`,
  };
}

// ───────────────────────── 1er tour ─────────────────────────

function parseFirstSection(
  wt: string,
  heading: string,
  year: number,
  unmapped: Set<string>,
  stats: { total: number; lost: number },
): WikiPoll[] {
  const body = sectionBody(wt, heading);
  if (!body) return [];
  const table = firstTable(body);
  if (!table) return [];
  const segs = rowSegments(table);

  let candCols: string[] | null = null;
  for (const seg of segs.slice(0, 6)) {
    const hs = cellLines(seg, "!").map(headerCandidate).filter(Boolean) as { short: string }[];
    if (hs.length >= 6) { candCols = hs.map((h) => h.short); break; }
  }
  if (!candCols) return [];

  const polls: WikiPoll[] = [];
  let ctx = { institute: "", start: "", end: "", sample: 0 };

  for (const seg of segs) {
    if (/scope=col/.test(seg) || /^!/.test(seg.trim())) continue;
    const cells = cellLines(seg, "|");
    if (cells.length === 0) continue;
    if (/colspan=/.test(seg) && cells.length <= 2) continue; // annotation

    let candStart = 0;
    if (/\{\{Sondeur\|/.test(cells[0] || "")) {
      const inst = cells[0].match(/\[https?:\/\/\S+\s+([^\]]+)\]/);
      ctx.institute = inst ? inst[1].trim() : cells[0].replace(/.*\|\s*/, "").replace(/[[\]]/g, "").trim();
      const d = parseDates(cells[1] || "", year);
      ctx.start = d?.start ?? "";
      ctx.end = d?.end ?? "";
      // échantillon : privilégier {{formatnum:N}} pour éviter le "6" du rowspan
      const smpCell = (cells[2] || "").replace(/rowspan\s*=\s*"?\d+"?/g, " ");
      const smpM = smpCell.match(/formatnum\s*[:|]\s*([\d  ]+)/) || smpCell.match(/(\d[\d  ]{2,})/);
      ctx.sample = smpM ? parseInt(smpM[1].replace(/\D/g, ""), 10) : 0;
      candStart = 3;
    } else if (parseDates(cells[0] || "", year) && cells.length >= candCols.length) {
      // Institut en rowspan au-dessus : cette ligne ouvre un NOUVEAU groupe
      // date + échantillon (fréquent en 2025). On saute ces 2 cellules — sinon
      // la date et l'échantillon sont pris pour des scores candidats.
      const d = parseDates(cells[0], year);
      ctx.start = d?.start ?? ctx.start;
      ctx.end = d?.end ?? ctx.end;
      const smpCell = (cells[1] || "").replace(/rowspan\s*=\s*"?\d+"?/g, " ");
      const smpM = smpCell.match(/formatnum\s*[:|]\s*([\d  ]+)/) || smpCell.match(/(\d[\d  ]{2,})/);
      if (smpM) ctx.sample = parseInt(smpM[1].replace(/\D/g, ""), 10);
      candStart = 2;
    }
    const candCells = cells.slice(candStart);
    if (candCells.length < candCols.length - 2) continue; // pas une ligne de données

    stats.total++;
    const scores: Partial<Record<CandidateId, number>> = {};
    for (let i = 0; i < candCols.length && i < candCells.length; i++) {
      const { value, reassign } = parseValueCell(candCells[i]);
      if (value == null) continue;
      const name = reassign || candCols[i];
      const id = resolveCandidateId(name);
      if (!id) { unmapped.add(name); continue; }
      scores[id] = value;
    }
    // colonne « Autre » : dernière cellule si réassignée
    if (candCells.length > candCols.length) {
      const { value, reassign } = parseValueCell(candCells[candCols.length]);
      if (value != null && reassign) {
        const id = resolveCandidateId(reassign);
        if (id) scores[id] = value; else unmapped.add(reassign);
      }
    }

    if (Object.keys(scores).length < 2 || !ctx.end) { stats.lost++; continue; }
    const ids = (Object.keys(scores) as CandidateId[]).sort();
    polls.push({
      hypothesisId: ids.join("+"),
      round: 1,
      institute: ctx.institute,
      sponsor: "—",
      publishedAt: ctx.end,
      fieldStart: ctx.start || ctx.end,
      fieldEnd: ctx.end,
      sampleSize: ctx.sample,
      hypothesis: ids.join("+"),
      scores,
    });
  }
  return polls;
}

// ───────────────────────── 2nd tour ─────────────────────────

function parseSecondSection(
  wt: string,
  heading: string,
  unmapped: Set<string>,
): WikiPoll[] {
  const body = sectionBody(wt, heading);
  if (!body) return [];
  const table = firstTable(body);
  if (!table) return [];

  // Candidats du titre : "=== Hypothèse Attal – Le Pen ==="
  const tm = heading.match(/Hypothèse\s+(.+?)\s*[–—-]\s*(.+?)\s*=/);
  if (!tm) return [];
  const idA = resolveCandidateId(tm[1].trim());
  const idB = resolveCandidateId(tm[2].trim());
  if (!idA) unmapped.add(tm[1].trim());
  if (!idB) unmapped.add(tm[2].trim());
  if (!idA || !idB) return [];

  const segs = rowSegments(table);
  const polls: WikiPoll[] = [];
  for (const seg of segs) {
    if (/scope=col/.test(seg) || /^!/.test(seg.trim())) continue;
    const cells = cellLines(seg, "|");
    if (cells.length < 5) continue;
    if (/colspan=/.test(seg)) continue; // annotation d'événement
    if (!/\{\{Sondeur\|/.test(cells[0] || "")) continue;

    const inst = cells[0].match(/\[https?:\/\/\S+\s+([^\]]+)\]/);
    const institute = inst ? inst[1].trim() : cells[0].replace(/.*\|\s*/, "").replace(/[[\]]/g, "").trim();
    const d = parseDates(cells[1] || "", 2026);
    const sample = parseInt((cells[2] || "").replace(/\D/g, ""), 10) || 0;
    const va = parseValueCell(cells[3]).value;
    const vb = parseValueCell(cells[4]).value;
    if (va == null || vb == null || !d) continue;

    polls.push({
      hypothesisId: heading.replace(/=/g, "").trim(),
      round: 2,
      institute,
      sponsor: "—",
      publishedAt: d.end,
      fieldStart: d.start,
      fieldEnd: d.end,
      sampleSize: sample,
      hypothesis: `${CANDIDATES[idA].last} vs ${CANDIDATES[idB].last}`,
      scores: { [idA]: va, [idB]: vb } as Partial<Record<CandidateId, number>>,
    });
  }
  return polls;
}

function secondHeadings(wt: string): string[] {
  return (wt.match(/^===\s*Hypothèse[^\n]*===\s*$/gm) || []).map((h) => h.trim());
}

// ───────────────────────── libellés d'hypothèse ─────────────────────────

const BLOCS: CandidateId[][] = [
  ["hollande", "glucksmann", "faure", "ruffin"],
  ["philippe", "attal", "bayrou"],
  ["retailleau", "wauquiez", "villepin", "bertrand"],
  ["lepen", "bardella"],
];

export function deriveHypothesisLabel(presentIds: CandidateId[], round: 1 | 2): string {
  const present = new Set(presentIds);
  if (round === 2) {
    return presentIds.slice(0, 2).map((id) => CANDIDATES[id].last).join(" vs ");
  }
  const picks: CandidateId[] = [];
  for (const bloc of BLOCS) {
    const f = bloc.find((id) => present.has(id));
    if (f) picks.push(f);
  }
  if (picks.length) return picks.map((id) => CANDIDATES[id].last).join(" · ");
  return presentIds.slice(0, 3).map((id) => CANDIDATES[id].last).join(" · ");
}

// ───────────────────────── fetch + orchestration ─────────────────────────

async function fetchWikitext(): Promise<string | null> {
  const url =
    `https://fr.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(ARTICLE)}` +
    `&prop=wikitext&format=json&formatversion=2`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { "user-agent": "VigieBot/1.0 (+lemillenaire.org)" },
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j?.parse?.wikitext ?? null;
  } catch {
    return null;
  }
}

export async function fetchWikipedia(): Promise<WikiData | null> {
  const wt = await fetchWikitext();
  if (!wt) return null;

  const unmapped = new Set<string>();
  const stats = { total: 0, lost: 0 };

  const first: WikiPoll[] = [];
  for (const { heading, year } of FIRST_SECTIONS) {
    first.push(...parseFirstSection(wt, heading, year, unmapped, stats));
  }

  const second: WikiPoll[] = [];
  for (const h of secondHeadings(wt)) {
    second.push(...parseSecondSection(wt, h, unmapped));
  }

  if (first.length === 0) return null;

  // tri antéchronologique ; à date de fin égale, le terrain le plus récent d'abord
  first.sort((a, b) =>
    a.fieldEnd !== b.fieldEnd
      ? a.fieldEnd < b.fieldEnd ? 1 : -1
      : a.fieldStart < b.fieldStart ? 1 : -1,
  );
  const latestDate = first[0]?.fieldEnd ?? null;
  const lastPoll = first[0]
    ? {
        institute: first[0].institute,
        dates: `${first[0].fieldStart} → ${first[0].fieldEnd}`,
      }
    : null;

  const unparsedRatio = stats.total ? stats.lost / stats.total : 0;
  const unmappedArr = [...unmapped].sort();
  if (unmappedArr.length) {
    console.warn(`[VIGIE] candidats Wikipédia non mappés : ${unmappedArr.join(", ")}`);
  }
  if (unparsedRatio > UNPARSED_THRESHOLD) {
    console.warn(
      `[VIGIE] ${Math.round(unparsedRatio * 100)} % de lignes non parsées → données partielles`,
    );
  }

  return {
    first,
    second,
    latestDate,
    lastPoll,
    unmapped: unmappedArr,
    count: first.length + second.length,
    partial: unparsedRatio > UNPARSED_THRESHOLD,
    unparsedRatio,
  };
}

/** Comptage léger pour l'alerte (nombre de sondages 1er tour parsés). */
export async function countWikipediaPolls(): Promise<number | null> {
  const data = await fetchWikipedia();
  return data ? data.first.length : null;
}
