"use client";

import { useMemo, useRef, useState } from "react";
import type { Aggregate, CandidateId } from "@/lib/types";
import { CANDIDATES } from "@/lib/candidates";
import {
  CHART_MOBILE,
  CHART_WEB,
  areaPath,
  definedRange,
  resolvePins,
  smoothPath,
  xAt,
  yAt,
  type Pt,
} from "@/lib/chart";

interface Props {
  aggregates: Aggregate[];
  milestones: string[];
  mobile?: boolean;
}

interface Line {
  id: CandidateId;
  color: string;
  points: Pt[];
  startIdx: number;
  endIdx: number;
  values: (number | null)[];
  last: Pt;
  current: number;
}

export default function AggregateChart({ aggregates, milestones, mobile }: Props) {
  const g = mobile ? CHART_MOBILE : CHART_WEB;
  const [isolated, setIsolated] = useState<CandidateId | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  const n = milestones.length;
  const baselineY = g.height - g.padB;

  const lines: Line[] = useMemo(() => {
    return aggregates
      .map((agg) => {
        const range = definedRange(agg.series.map((p) => p.value));
        if (!range) return null;
        const pts: Pt[] = [];
        for (let i = range.start; i <= range.end; i++) {
          const v = agg.series[i].value;
          if (v == null) continue;
          pts.push({ x: xAt(i, n, g), y: yAt(v, g) });
        }
        return {
          id: agg.candidate,
          color: CANDIDATES[agg.candidate].color,
          points: pts,
          startIdx: range.start,
          endIdx: range.end,
          values: agg.series.map((p) => p.value),
          last: pts[pts.length - 1],
          current: agg.current,
        } as Line;
      })
      .filter((l): l is Line => l !== null);
  }, [aggregates, g, n]);

  // Leader = plus haut score courant (sert d'aire par défaut si aucune isolation).
  const leader = useMemo(
    () => [...lines].sort((a, b) => b.current - a.current)[0],
    [lines],
  );
  const areaLine = isolated ? lines.find((l) => l.id === isolated) : leader;

  // Anti-collision des pastilles de fin de courbe.
  const pinY = useMemo(() => {
    const desired = lines.map((l) => ({ key: l.id, y: l.last.y }));
    return resolvePins(desired, 25, g.padT + 6, g.height - g.padB + 6);
  }, [lines, g]);

  const gridValues = [0, 10, 20, 30, 40];

  function handleMove(clientX: number) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = (clientX - rect.left) / rect.width;
    const x = frac * g.width;
    // milestone le plus proche
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(xAt(i, n, g) - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    setHover(best);
  }

  // Tooltip : liste triée décroissante des candidats à l'échéance survolée.
  const tooltipRows =
    hover != null
      ? aggregates
          .map((a) => ({
            id: a.candidate,
            value: a.series[hover]?.value ?? null,
          }))
          .filter((r): r is { id: CandidateId; value: number } => r.value != null)
          .sort((a, b) => b.value - a.value)
      : [];

  const hoverX = hover != null ? xAt(hover, n, g) : 0;
  const flip = hover != null && hoverX / g.width > 0.52;

  return (
    <div className="w-full">
      {/* Légende — chips cliquables pour isoler un candidat */}
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtrer les candidats">
        {lines.map((l) => {
          const c = CANDIDATES[l.id];
          const active = isolated === l.id;
          return (
            <button
              key={l.id}
              type="button"
              className="chip tap"
              data-active={active}
              aria-pressed={active}
              onClick={() => setIsolated(active ? null : l.id)}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: c.color }}
              />
              {c.last}
              <span className="mono text-ink-faint">{l.current.toFixed(0)}</span>
            </button>
          );
        })}
        {isolated && (
          <button
            type="button"
            className="chip tap"
            onClick={() => setIsolated(null)}
          >
            ✕ Tout afficher
          </button>
        )}
      </div>

      <div
        ref={wrapRef}
        className="relative w-full touch-none select-none"
        style={{ aspectRatio: `${g.width} / ${g.height}` }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      >
        <svg
          viewBox={`0 0 ${g.width} ${g.height}`}
          className="absolute inset-0 h-full w-full overflow-visible"
          role="img"
          aria-label="Courbe agrégée des intentions de vote au 1er tour"
        >
          <defs>
            {areaLine && (
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={areaLine.color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={areaLine.color} stopOpacity="0" />
              </linearGradient>
            )}
            <filter id="halo" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {lines.map((l) => (
              <clipPath id={`clip-${l.id}`} key={l.id}>
                <circle cx={0} cy={0} r={11} />
              </clipPath>
            ))}
          </defs>

          {/* Grille horizontale pointillée 0/10/20/30/40 % */}
          {gridValues.map((v) => {
            const y = yAt(v, g);
            return (
              <g key={v}>
                <line
                  x1={g.padL}
                  x2={g.width - g.padR}
                  y1={y}
                  y2={y}
                  stroke="rgba(148,175,214,.14)"
                  strokeDasharray="2 5"
                />
                <text
                  x={g.padL - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="mono"
                  fontSize="10"
                  fill="#5f748f"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Étiquettes d'axe X (échéances) */}
          {milestones.map((m, i) => (
            <text
              key={m}
              x={xAt(i, n, g)}
              y={g.height - g.padB + 20}
              textAnchor="middle"
              className="mono"
              fontSize="9.5"
              fill={hover === i ? "#eaf1fb" : "#5f748f"}
            >
              {m}
            </text>
          ))}

          {/* Aire dégradée sous le leader / candidat isolé */}
          {areaLine && (
            <path d={areaPath(areaLine.points, baselineY)} fill="url(#area-grad)" />
          )}

          {/* Courbes */}
          {lines.map((l) => {
            const dimmed = isolated != null && isolated !== l.id;
            const highlighted = isolated === l.id;
            return (
              <path
                key={l.id}
                d={smoothPath(l.points)}
                fill="none"
                stroke={l.color}
                strokeWidth={highlighted ? 3.4 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={dimmed ? 0.09 : 1}
                filter={highlighted ? "url(#halo)" : undefined}
              />
            );
          })}

          {/* Crosshair + points de survol */}
          {hover != null && (
            <>
              <line
                x1={hoverX}
                x2={hoverX}
                y1={g.padT}
                y2={g.height - g.padB}
                stroke="rgba(216,178,74,.45)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {lines.map((l) => {
                if (hover < l.startIdx || hover > l.endIdx) return null;
                const v = l.values[hover];
                if (v == null) return null;
                const dimmed = isolated != null && isolated !== l.id;
                return (
                  <circle
                    key={l.id}
                    cx={hoverX}
                    cy={yAt(v, g)}
                    r={3.4}
                    fill="#061426"
                    stroke={l.color}
                    strokeWidth={2}
                    opacity={dimmed ? 0.12 : 1}
                  />
                );
              })}
            </>
          )}

          {/* Pastilles de fin de courbe : photo ronde (fallback monogramme) + % */}
          {lines.map((l) => {
            const c = CANDIDATES[l.id];
            const dimmed = isolated != null && isolated !== l.id;
            const py = pinY[l.id] ?? l.last.y;
            const px = l.last.x + 20;
            const showPhoto = c.photo && !failedPhotos.has(l.id);
            return (
              <g key={l.id} opacity={dimmed ? 0.18 : 1}>
                {/* Connecteur Bézier depuis le dernier point */}
                <path
                  d={`M ${l.last.x} ${l.last.y} C ${l.last.x + 12} ${l.last.y}, ${
                    px - 12
                  } ${py}, ${px} ${py}`}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={1.2}
                  opacity={0.5}
                />
                {/* Pastille — repère translaté pour aligner le clip circulaire */}
                <g transform={`translate(${px} ${py})`}>
                  <circle cx={0} cy={0} r={11} fill={c.color} />
                  {/* Monogramme sous la photo : reste visible si l'image échoue */}
                  <text
                    x={0}
                    y={3.5}
                    textAnchor="middle"
                    className="mono"
                    fontSize="8.5"
                    fontWeight={600}
                    fill="#04101f"
                  >
                    {c.mono}
                  </text>
                  {showPhoto && (
                    <image
                      href={c.photo}
                      x={-11}
                      y={-11}
                      width={22}
                      height={22}
                      clipPath={`url(#clip-${l.id})`}
                      preserveAspectRatio="xMidYMid slice"
                      onError={() =>
                        setFailedPhotos((prev) => new Set(prev).add(l.id))
                      }
                    />
                  )}
                  <circle
                    cx={0}
                    cy={0}
                    r={11}
                    fill="none"
                    stroke="#061426"
                    strokeWidth={1.5}
                  />
                  <text
                    x={16}
                    y={3.5}
                    className="mono"
                    fontSize="11"
                    fontWeight={600}
                    fill={dimmed ? "#5f748f" : "#eaf1fb"}
                  >
                    {l.current.toFixed(0)}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Tooltip HTML superposé */}
        {hover != null && tooltipRows.length > 0 && (
          <div
            className="panel pointer-events-none absolute z-10 px-3 py-2"
            style={{
              left: flip ? undefined : `${(hoverX / g.width) * 100}%`,
              right: flip ? `${(1 - hoverX / g.width) * 100}%` : undefined,
              top: "6%",
              transform: flip ? "translateX(-12px)" : "translateX(12px)",
              borderColor: "rgba(216,178,74,.4)",
              minWidth: 150,
            }}
          >
            <div className="eyebrow mb-1.5">{milestones[hover]}</div>
            <ul className="space-y-1">
              {tooltipRows.map((r) => {
                const c = CANDIDATES[r.id];
                return (
                  <li key={r.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: c.color }}
                    />
                    <span className="flex-1 text-ink-soft">{c.last}</span>
                    <span className="mono font-semibold text-ink">
                      {r.value.toFixed(0)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
