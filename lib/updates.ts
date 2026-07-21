import { readState, writeState, type UpdatesState } from "./store";

/**
 * Alerte « nouveau sondage » par double signal croisé :
 *  1) flux Atom des commits (déclencheur),
 *  2) .last_poll_count (filtre).
 * Notification SEULEMENT si (nouveau commit) ET (compteur en hausse) — un commit
 * sans hausse du compteur = correctif technique, pas d'alerte.
 */

const RAW = "https://raw.githubusercontent.com/MieuxVoter/presidentielle2027/main";
const COUNT_URL = `${RAW}/.last_poll_count`;
const ATOM_URL =
  "https://github.com/MieuxVoter/presidentielle2027/commits/main.atom";

export interface CheckResult {
  ok: boolean;
  initialized?: boolean;
  newPolls?: number; // sondages ajoutés lors de ce passage
  count: number | null;
  unseen: number;
  latestCommit?: { title: string; url: string; date: string };
  note?: string;
}

interface Commit {
  id: string;
  title: string;
  url: string;
  date: string;
}

async function fetchCount(): Promise<number | null> {
  try {
    const res = await fetch(COUNT_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const n = parseInt((await res.text()).trim(), 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

async function fetchLatestCommit(): Promise<Commit | null> {
  try {
    const res = await fetch(ATOM_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const xml = await res.text();
    const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/i);
    if (!entry) return null;
    const block = entry[1];
    const id = (block.match(/<id>([\s\S]*?)<\/id>/i)?.[1] || "").trim();
    const title = (block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "")
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .trim();
    const url = block.match(/<link[^>]*href="([^"]+)"/i)?.[1] || "";
    const date = (block.match(/<updated>([\s\S]*?)<\/updated>/i)?.[1] || "").trim();
    if (!id) return null;
    return { id, title, url, date };
  } catch {
    return null;
  }
}

async function notifySlack(msg: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.warn(
      "[VIGIE] SLACK_WEBHOOK_URL absente — alerte Slack ignorée (le reste fonctionne).",
    );
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: msg }),
    });
  } catch (e) {
    console.warn("[VIGIE] Échec de l'envoi Slack :", e);
  }
}

/**
 * Exécute une vérification. Idempotent : ne notifie qu'au franchissement réel du
 * compteur, met à jour et persiste l'état.
 */
export async function checkForUpdates(): Promise<CheckResult> {
  const state = await readState();
  const count = await fetchCount();
  const commit = await fetchLatestCommit();

  if (count == null) {
    // Source injoignable : on ne touche à rien, retry au prochain cycle.
    return { ok: false, count: state.lastCount, unseen: state.unseen, note: "compteur injoignable" };
  }

  const next: UpdatesState = {
    ...state,
    lastCheckedAt: new Date().toISOString(),
  };

  // Premier passage : on mémorise le point zéro, sans alerter.
  if (state.lastCount == null) {
    next.lastCount = count;
    next.lastCommitId = commit?.id ?? null;
    await writeState(next);
    return {
      ok: true,
      initialized: true,
      count,
      unseen: next.unseen,
      latestCommit: commit ?? undefined,
      note: "point zéro mémorisé",
    };
  }

  const countRose = count > state.lastCount;
  const newCommit = commit != null && commit.id !== state.lastCommitId;

  if (countRose && newCommit) {
    const delta = count - state.lastCount;
    next.lastCount = count;
    next.lastCommitId = commit!.id;
    next.unseen = state.unseen + delta;
    await writeState(next);

    const line =
      `🗳️ *VIGIE 2027* — ${delta} nouveau${delta > 1 ? "x" : ""} sondage${delta > 1 ? "s" : ""} ` +
      `(compteur ${state.lastCount} → ${count}).` +
      (commit?.title ? `\n> ${commit.title}` : "") +
      (commit?.url ? `\n${commit.url}` : "");
    await notifySlack(line);

    return {
      ok: true,
      newPolls: delta,
      count,
      unseen: next.unseen,
      latestCommit: commit ?? undefined,
    };
  }

  // Commit sans hausse (fix technique) ou rien de neuf : on met à jour le suivi
  // du dernier commit pour éviter de re-déclencher, sans alerter.
  if (newCommit) next.lastCommitId = commit!.id;
  await writeState(next);
  return {
    ok: true,
    newPolls: 0,
    count,
    unseen: next.unseen,
    latestCommit: commit ?? undefined,
    note: countRose ? "compteur en hausse sans nouveau commit" : "rien de neuf",
  };
}

/** Consulté : remet le compteur « non vus » à zéro. */
export async function markSeen(): Promise<number> {
  const state = await readState();
  await writeState({ ...state, unseen: 0 });
  return 0;
}
