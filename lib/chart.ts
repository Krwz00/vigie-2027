/**
 * Helpers géométriques du graphe agrégé (rendu SVG identique à la maquette).
 * viewBox 0 0 980 486 (H=430 en mobile), padL=34, padR=118 (92 mobile),
 * padT=26, padB=42, échelle Y 0–40 %. Lissage Catmull-Rom → Bézier (tension 1/6).
 */

export interface ChartGeom {
  width: number;
  height: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  maxY: number;
}

export const CHART_WEB: ChartGeom = {
  width: 980,
  height: 486,
  padL: 34,
  padR: 118,
  padT: 26,
  padB: 42,
  maxY: 40,
};

export const CHART_MOBILE: ChartGeom = {
  ...CHART_WEB,
  height: 430,
  padR: 92,
};

export interface Pt {
  x: number;
  y: number;
}

export function xAt(i: number, n: number, g: ChartGeom): number {
  const inner = g.width - g.padL - g.padR;
  if (n <= 1) return g.padL;
  return g.padL + (inner * i) / (n - 1);
}

export function yAt(value: number, g: ChartGeom): number {
  const inner = g.height - g.padT - g.padB;
  const clamped = Math.max(0, Math.min(g.maxY, value));
  return g.padT + inner * (1 - clamped / g.maxY);
}

/** Indices [start,end] non-nuls d'une série (gère l'entrée tardive d'un candidat). */
export function definedRange(
  values: (number | null)[],
): { start: number; end: number } | null {
  const idx = values
    .map((v, i) => (v != null ? i : -1))
    .filter((i) => i >= 0);
  if (!idx.length) return null;
  return { start: idx[0], end: idx[idx.length - 1] };
}

/**
 * Construit un chemin lissé Catmull-Rom → Bézier cubique (tension 1/6)
 * à partir de points déjà projetés en coordonnées écran.
 */
export function smoothPath(points: Pt[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const t = 1 / 6;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;

    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Chemin d'aire fermée sous une courbe (jusqu'à la ligne de base). */
export function areaPath(points: Pt[], baselineY: number): string {
  if (points.length < 2) return "";
  const line = smoothPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

/**
 * Anti-collision verticale des pastilles de fin de courbe.
 * Prend les positions Y désirées (triées ou non), impose un écart mini `gap`,
 * pousse vers le bas puis corrige si dépassement en pied.
 */
export function resolvePins(
  desired: { key: string; y: number }[],
  gap: number,
  top: number,
  bottom: number,
): Record<string, number> {
  const sorted = [...desired].sort((a, b) => a.y - b.y);
  const out: { key: string; y: number }[] = [];

  // Passe descendante : impose l'écart minimal.
  for (const item of sorted) {
    let y = item.y;
    if (out.length) {
      const prev = out[out.length - 1].y;
      if (y - prev < gap) y = prev + gap;
    }
    out.push({ key: item.key, y });
  }

  // Correction si la dernière pastille dépasse le pied : on remonte le paquet.
  const overflow = out.length ? out[out.length - 1].y - bottom : 0;
  if (overflow > 0) {
    for (let i = out.length - 1; i >= 0; i--) {
      out[i].y -= overflow;
      if (i > 0 && out[i].y - out[i - 1].y >= gap) break;
    }
    // Garantit qu'on ne remonte pas au-dessus du plafond.
    if (out.length && out[0].y < top) {
      const push = top - out[0].y;
      for (let i = 0; i < out.length; i++) out[i].y += push;
    }
  }

  const map: Record<string, number> = {};
  for (const o of out) map[o.key] = o.y;
  return map;
}
