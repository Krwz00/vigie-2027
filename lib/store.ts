import { promises as fs } from "fs";
import path from "path";

/**
 * Petit store d'état pour les alertes « nouveau sondage ».
 * Persistance fichier JSON dans /data ; repli mémoire si le FS est en
 * lecture seule (ex. runtime serverless) — l'app ne crashe jamais pour ça.
 */

export interface UpdatesState {
  lastCount: number | null; // dernier .last_poll_count vu
  lastCommitId: string | null; // dernier commit Atom vu
  unseen: number; // sondages arrivés depuis la dernière consultation
  lastCheckedAt: string | null;
}

const DEFAULT_STATE: UpdatesState = {
  lastCount: null,
  lastCommitId: null,
  unseen: 0,
  lastCheckedAt: null,
};

const FILE = path.join(process.cwd(), "data", "updates-state.json");

// Repli mémoire (persiste le temps de vie du process).
let memory: UpdatesState | null = null;

export async function readState(): Promise<UpdatesState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return memory ? { ...memory } : { ...DEFAULT_STATE };
  }
}

export async function writeState(state: UpdatesState): Promise<void> {
  memory = { ...state };
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // FS en lecture seule : on garde le repli mémoire, pas de crash.
  }
}
