import { readFile } from "fs/promises";
import path from "path";

/**
 * Vue Prevision : sortie du modele vigie, produite hors site par
 * `build_vigie_forecast.py` et deposee dans public/forecast.json par le pipeline.
 * Source distincte de l'agregateur (Wikipedia), une seule verite pour chacune.
 */
export interface ForecastCandidate {
  id: string;
  name: string;
  color: string;
  score: number;
  lo: number;
  hi: number;
  pQualif: number;
}

export interface ForecastDuelSide {
  id: string;
  name: string;
  color: string;
  score: number;
  lo: number;
  hi: number;
}

export interface ForecastDuel {
  nonRN: ForecastDuelSide;
  lePen: ForecastDuelSide;
  pAppariement: number;
  vainqueur: string;
}

export interface DeptLead {
  leadId: string;
  leadName: string;
  leadColor: string;
  leadScore: number;
}

export interface ForecastHypothesis {
  id: string;
  label: string;
  n: number;
  proba: number;
  candidates: ForecastCandidate[];
  duel: ForecastDuel | null;
  dept: Record<string, DeptLead>;
}

export interface ForecastData {
  status: "available" | "unavailable";
  source: string;
  updatedAt: string;
  horizonJours: number;
  nSondages: number;
  electionDate: string;
  phrase: string;
  note: string;
  hypotheses: ForecastHypothesis[];
}

export async function loadForecast(): Promise<ForecastData | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), "public", "forecast.json"), "utf8");
    const data = JSON.parse(raw) as ForecastData;
    if (data.status !== "available" || !data.hypotheses?.length) return null;
    return data;
  } catch {
    return null; // pas de fausse donnee si le fichier manque
  }
}
