"use client";

/**
 * Courbe d'evolution de la prevision dans le temps. Une ligne par candidat, sa
 * couleur du site, alimentee par la serie de forecast.json (une valeur par date
 * d'execution). L'axe va de la premiere date au jour du scrutin ; la courbe se
 * remplit a chaque nouvelle vague. Style du site, SVG maison comme le barometre.
 */

import { useState } from "react";
import type { ForecastCandidate } from "@/lib/forecast";

const W = 720;
const H = 300;
const PAD = { l: 30, r: 12, t: 12, b: 24 };

function frShort(iso: string) {
  const [, m, d] = iso.split("-");
  const MO = ["", "janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
  return `${parseInt(d, 10)} ${MO[parseInt(m, 10)]}`;
}

export default function ForecastChart({ candidates, electionDate }: { candidates: ForecastCandidate[]; electionDate: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = [...candidates].sort((a, b) => b.score - a.score).slice(0, 7).filter((c) => c.series?.length);
  if (!top.length) return null;

  const allDates = Array.from(new Set(top.flatMap((c) => c.series.map((p) => p.date)))).sort();
  const t0 = new Date(allDates[0] + "T00:00:00Z").getTime();
  const t1 = new Date(electionDate + "T00:00:00Z").getTime();
  const span = Math.max(t1 - t0, 86400000);
  const maxY = Math.max(10, ...top.flatMap((c) => c.series.map((p) => p.hi)));
  const x = (iso: string) => PAD.l + ((new Date(iso + "T00:00:00Z").getTime() - t0) / span) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / maxY) * (H - PAD.t - PAD.b);

  const ticks = [0, 25, 50, 75, 100].map((p) => Math.round((maxY * p) / 100)).filter((v, i, a) => a.indexOf(v) === i);
  const xline = x(electionDate);

  return (
    <section className="rounded-panel border border-panelBorder bg-panel p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Évolution de la prévision</h2>
        <span className="font-body text-[11px] text-ink-faint">jusqu&apos;au scrutin du 18 avril 2027</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Courbe d'évolution de la prévision">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#1c3350" strokeWidth={0.7} />
            <text x={PAD.l - 5} y={y(v) + 3} textAnchor="end" fontSize={9} fill="#5f748f" fontFamily="var(--font-body)">{v}</text>
          </g>
        ))}
        <line x1={xline} x2={xline} y1={PAD.t} y2={H - PAD.b} stroke="#d8b24a" strokeWidth={0.8} strokeDasharray="4 4" opacity={0.5} />
        <text x={xline - 4} y={PAD.t + 8} textAnchor="end" fontSize={9} fill="#8ba0bd" fontFamily="var(--font-body)">scrutin</text>
        {top.map((c, i) => {
          const pts = c.series.map((p) => ({ px: x(p.date), py: y(p.score) }));
          const dim = hover !== null && hover !== i;
          const dpath = pts.map((p, k) => (k ? "L" : "M") + p.px.toFixed(1) + " " + p.py.toFixed(1)).join(" ");
          return (
            <g key={c.id} opacity={dim ? 0.18 : 1} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              {pts.length > 1 && <path d={dpath} fill="none" stroke={c.color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />}
              {pts.map((p, k) => <circle key={k} cx={p.px} cy={p.py} r={3.2} fill={c.color} stroke="#050f1e" strokeWidth={1} />)}
              {(() => { const last = pts[pts.length - 1]; return <text x={last.px + 6} y={last.py + 3} fontSize={10} fill={c.color} fontFamily="var(--font-body)" fontWeight={600}>{c.name.split(" ").slice(-1)[0]}</text>; })()}
            </g>
          );
        })}
        <text x={PAD.l} y={H - 6} fontSize={9} fill="#5f748f" fontFamily="var(--font-body)">{frShort(allDates[0])}</text>
      </svg>
      <p className="mt-1 font-body text-[11px] text-ink-faint">
        La courbe se remplit à chaque nouvelle vague de sondages. Chaque prévision quotidienne est archivée, trace vérifiable du modèle.
      </p>
    </section>
  );
}
