import { readState, writeState, type UpdatesState } from "./store";
import { countWikipediaPolls } from "./wikipedia";
import { WIKI_ARTICLE_URL } from "./wikipedia";

/**
 * Alerte « nouveau sondage » — signal réadapté à Wikipédia.
 * On compare le nombre de sondages 1er tour parsés depuis Wikipédia au dernier
 * compte mémorisé ; toute HAUSSE = nouveau(x) sondage(s) → Slack + badge.
 * (L'ancien double-signal MieuxVoter — .last_poll_count + Atom — n'existe plus.)
 */

export interface CheckResult {
  ok: boolean;
  initialized?: boolean;
  newPolls?: number;
  count: number | null;
  unseen: number;
  note?: string;
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

export async function checkForUpdates(): Promise<CheckResult> {
  const state = await readState();
  const count = await countWikipediaPolls();

  if (count == null) {
    // Source injoignable : on ne touche à rien, retry au prochain cycle.
    return { ok: false, count: state.lastCount, unseen: state.unseen, note: "Wikipédia injoignable" };
  }

  const next: UpdatesState = { ...state, lastCheckedAt: new Date().toISOString() };

  // Premier passage : mémorise le point zéro, sans alerter.
  if (state.lastCount == null) {
    next.lastCount = count;
    await writeState(next);
    return { ok: true, initialized: true, count, unseen: next.unseen, note: "point zéro mémorisé" };
  }

  if (count > state.lastCount) {
    const delta = count - state.lastCount;
    next.lastCount = count;
    next.unseen = state.unseen + delta;
    await writeState(next);
    await notifySlack(
      `🗳️ *VIGIE 2027* — ${delta} nouveau${delta > 1 ? "x" : ""} sondage${delta > 1 ? "s" : ""} ` +
        `sur Wikipédia (${state.lastCount} → ${count}).\n${WIKI_ARTICLE_URL}`,
    );
    return { ok: true, newPolls: delta, count, unseen: next.unseen };
  }

  // Baisse (réorganisation de l'article) ou stagnation : on recale sans alerter.
  if (count < state.lastCount) next.lastCount = count;
  await writeState(next);
  return { ok: true, newPolls: 0, count, unseen: next.unseen, note: "rien de neuf" };
}

/** Consulté : remet le compteur « non vus » à zéro. */
export async function markSeen(): Promise<number> {
  const state = await readState();
  await writeState({ ...state, unseen: 0 });
  return 0;
}
