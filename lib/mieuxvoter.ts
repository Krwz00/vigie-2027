import type { CandidateId, Poll } from "./types";
import { MV_ID_MAP, CANDIDATES } from "./candidates";

/**
 * Connecteur MieuxVoter/presidentielle2027 — la VRAIE source.
 * https://github.com/MieuxVoter/presidentielle2027 (dépôt vivant, licence MIT,
 * JSON régénéré à chaque sondage mergé). Fetch RAW direct, revalidation ISR
 * horaire ; aucune donnée fabriquée si la source échoue.
 */

const RAW = "https://raw.githubusercontent.com/MieuxVoter/presidentielle2027/main";
export const SOURCE_URL = "https://github.com/MieuxVoter/presidentielle2027";
export const JSON_URL = `${RAW}/presidentielle2027.json`;

interface RawCandidat {
  candidate_id: string;
  candidat?: string;
  intentions?: number;
}
interface RawPoll {
  poll_id: string;
  institut?: string;
  commanditaire?: string;
  debut_enquete?: string;
  fin_enquete?: string;
  echantillon?: number | string;
  hypothese?: string;
  tour?: string; // "1er Tour" | "2nd Tour"
  candidats?: RawCandidat[];
}

export interface MVPoll extends Poll {
  pollId: string;
  hypothesisId: string;
  round: 1 | 2;
}

export interface MVData {
  first: MVPoll[]; // 1er tour
  second: MVPoll[]; // 2nd tour
  hypComment: Map<string, string>; // id_hypothese → commentaire (hypotheses.csv)
  latestDate: string | null;
  unmapped: string[]; // candidate_id non rattachés (logués)
  count: number; // nb de sondages-hypothèses
}

/** Parseur CSV minimal gérant les champs entre guillemets. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else q = false;
      } else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function round(poll: RawPoll): 1 | 2 {
  return (poll.tour || "").includes("2") ? 2 : 1;
}

// Canonicalise le nom d'institut (le dépôt mélange les casses : ELABE, verian…).
const INSTITUTE_CANON: [RegExp, string][] = [
  [/^elabe/i, "Elabe"],
  [/^ifop/i, "Ifop"],
  [/^opinion\s?way/i, "OpinionWay"],
  [/^cluster\s?17/i, "Cluster17"],
  [/harris/i, "Harris Interactive"],
  [/^odoxa/i, "Odoxa"],
  [/^ipsos\s?bva/i, "Ipsos-BVA"],
  [/^ipsos/i, "Ipsos"],
  [/^bva/i, "BVA"],
  [/^verian/i, "Verian"],
  [/^csa/i, "CSA"],
];

function canonicalInstitute(name: string | undefined): string {
  const n = (name || "").trim();
  if (!n) return "Institut";
  for (const [re, canon] of INSTITUTE_CANON) if (re.test(n)) return canon;
  return n;
}

function sampleOf(v: number | string | undefined): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseInt(v.replace(/\D/g, ""), 10) || 0;
  return 0;
}

/**
 * Récupère et normalise le dépôt MieuxVoter.
 * Renvoie null si le JSON est indisponible (état « données indisponibles »),
 * jamais de seed.
 */
export async function fetchMieuxVoter(): Promise<MVData | null> {
  const jsonText = await fetchText(JSON_URL);
  if (!jsonText) return null;

  let raw: RawPoll[];
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length === 0) return null;

  // Libellés d'hypothèses (best-effort ; le JSON suffit sinon).
  const hypComment = new Map<string, string>();
  const hypText = await fetchText(`${RAW}/hypotheses.csv`);
  if (hypText) {
    const rows = parseCSV(hypText);
    const header = rows[0] || [];
    const idI = header.indexOf("id_hypothese");
    const comI = header.indexOf("commentaire");
    if (idI >= 0) {
      for (const r of rows.slice(1)) {
        if (r[idI]) hypComment.set(r[idI], (r[comI] || "").trim());
      }
    }
  }

  const unmappedSet = new Set<string>();
  const first: MVPoll[] = [];
  const second: MVPoll[] = [];
  let latestDate: string | null = null;

  for (const p of raw) {
    const scores: Partial<Record<CandidateId, number>> = {};
    for (const c of p.candidats || []) {
      const id = MV_ID_MAP[c.candidate_id];
      if (!id) {
        unmappedSet.add(c.candidate_id);
        continue;
      }
      if (typeof c.intentions === "number") scores[id] = c.intentions;
    }
    if (Object.keys(scores).length < 2) continue;

    const fin = (p.fin_enquete || "").slice(0, 10);
    if (fin && (!latestDate || fin > latestDate)) latestDate = fin;

    const mv: MVPoll = {
      pollId: p.poll_id,
      hypothesisId: p.hypothese || "",
      round: round(p),
      institute: canonicalInstitute(p.institut),
      sponsor: p.commanditaire || "—",
      publishedAt: fin || (p.debut_enquete || "").slice(0, 10),
      fieldStart: (p.debut_enquete || fin).slice(0, 10),
      fieldEnd: fin,
      sampleSize: sampleOf(p.echantillon),
      hypothesis: p.hypothese || "",
      scores,
    };
    if (mv.round === 2) second.push(mv);
    else first.push(mv);
  }

  const unmapped = [...unmappedSet].sort();
  if (unmapped.length) {
    // Journalisation : aucun candidat n'est jeté silencieusement.
    console.warn(
      `[VIGIE] candidate_id non mappés (ignorés du rendu) : ${unmapped.join(", ")}. ` +
        `Ajoutez-les à MV_ID_MAP + CANDIDATES dans lib/candidates.ts.`,
    );
  }

  return {
    first,
    second,
    hypComment,
    latestDate,
    unmapped,
    count: first.length + second.length,
  };
}

/**
 * Libellé lisible d'une hypothèse, dérivé des candidats qui DISCRIMINENT les
 * configurations (jamais « H41 » brut). On retient un représentant par bloc
 * variable : gauche sociale-démocrate · centre · droite · RN. (Mélenchon,
 * Zemmour, etc. sont quasi constants → non discriminants, donc omis.)
 */
const BLOCS: CandidateId[][] = [
  ["hollande", "glucksmann", "faure"], // gauche / centre-gauche variable
  ["philippe", "attal", "bayrou"], // centre
  ["retailleau", "wauquiez", "villepin", "bertrand"], // droite
  ["lepen", "bardella"], // RN
];

export function deriveHypothesisLabel(
  presentIds: CandidateId[],
  round: 1 | 2,
): string {
  const present = new Set(presentIds);
  if (round === 2) {
    // Duel : « X vs Y » (ordre du sondage)
    return presentIds.slice(0, 2).map((id) => CANDIDATES[id].last).join(" vs ");
  }
  const picks: CandidateId[] = [];
  for (const bloc of BLOCS) {
    const found = bloc.find((id) => present.has(id));
    if (found) picks.push(found);
  }
  if (picks.length) return picks.map((id) => CANDIDATES[id].last).join(" · ");
  // Repli : les 3 premiers candidats présents.
  return presentIds
    .slice(0, 3)
    .map((id) => CANDIDATES[id].last)
    .join(" · ");
}
