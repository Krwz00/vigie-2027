import { readFile } from "fs/promises";
import path from "path";

export interface GridPoint {
  value: number;
  mae3?: number;
  forecast?: Record<string, Record<string, number>>;
}
export interface Param {
  label: string;
  default: number;
  calibrated: number;
  min: number;
  max: number;
  recompute: "grille" | "navigateur";
  note: string;
  backtest?: string;
  grid?: GridPoint[];
}
export interface HouseRow { institut: string; value: number; se: number; n: number }
export interface F2Hyp {
  id: string;
  label: string;
  proba: number;
  duel: null | {
    nonRN: { id: string; name: string; score: number; bloc: string };
    lePen: { score: number };
    blocs: Record<string, number>;
  };
}
export interface SettingsData {
  updatedAt: string;
  family1: { backtestBase: string; tau_delta: Param; tau_theta: Param; tau: Param; g: Param };
  family2: {
    hypotheses: F2Hyp[];
    report: Record<string, number[]>;
    report_declarative: Record<string, number[]>;
    blocLabels: Record<string, string>;
  };
  family3: {
    house: Record<string, HouseRow[]>;
    houseNote: string;
    hypEffectNote: string;
    penchant: { note: string; min: number; max: number; median: number };
    sdByHorizon: { horizon: number; sd: number }[];
    sdNote: string;
  };
}

export async function loadSettings(): Promise<SettingsData | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), "public", "settings.json"), "utf8");
    return JSON.parse(raw) as SettingsData;
  } catch {
    return null;
  }
}
