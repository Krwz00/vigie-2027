"use client";

import { useMemo, useRef, useState } from "react";
import type { Aggregate, CandidateId, Poll } from "@/lib/types";
import { CANDIDATES } from "@/lib/candidates";
import { buildRawInstituteSeries } from "@/lib/aggregate";
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

const ALL = "all"; // valeur du sélecteur « Tous les instituts »

interface Props {
  aggregates: Aggregate[];
  milestones: string[];
  milestoneDates: string[];
  barometerPolls: Poll[];
  institutes: string[];
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

export default function AggregateChart({
  aggregates,
  milestones,
  milestoneDates,
  barometerPolls,
  institutes,
  mobile,
}: Props) {
  const g = mobile ? CHART_MOBILE : CHART_WEB;
  const [isolated, setIsolated] = useState<CandidateId | null>(null);
  const [institute, setInstitute] = useState<string>(ALL);
  const [hover, setHover] = useState<number | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  const n = milestones.length;
  const baselineY = g.height - g.padB;

  // Mode « institut unique » : série BRUTE de l'institut (pas de pondération),
  // calculée côté client à l'intérieur de la MÊME config. Sinon : agrégat
  // pondéré inter-instituts fourni par le serveur (comportement inchangé).
  const instituteMode = institute !== ALL;
  const activeAggregates = useMemo(
    () =>
      instituteMode
        ? buildRawInstituteSeries(barometerPolls, institute, milestoneDates, milestones)
        : aggregates,
    [instituteMode, barometerPolls, institute, milestoneDates, milestones, aggregates],
  );

  const lines: Line[] = useMemo(() => {
    return activeAggregates
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
  }, [activeAggregates, g, n]);

  // Classement courant : leader + duo de tête (rendus plus visibles).
  const rankedIds = useMemo(
    () => [...lines].sort((a, b) => b.current - a.current).map((l) => l.id),
    [lines],
  );
  const leader = lines.find((l) => l.id === rankedIds[0]);
  const topTwo = new Set(rankedIds.slice(0, 2));
  // Pas d'aire dégradée en mode institut (série brute : ne pas suggérer un
  // volume lissé sur peu de mesures).
  const areaLine = instituteMode
    ? null
    : isolated
      ? lines.find((l) => l.id === isolated)
      : leader;

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
      ? activeAggregates
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
      {/* Filtre par institut : « Tous » = moyenne pondérée inter-instituts ;
          un institut = ses vagues brutes, à l'intérieur de la même hypothèse. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor="inst-filter" className="eyebrow">
          Institut
        </label>
        <select
          id="inst-filter"
          className="select tap"
          value={institute}
          onChange={(e) => {
            setInstitute(e.target.value);
            setHover(null);
            setIsolated(null);
          }}
        >
          <option value={ALL}>Tous les instituts</option>
          {institutes.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <span className="mono text-[11px] text-ink-faint">
          {instituteMode
            ? "vagues brutes de l’institut (non lissées)"
            : "moyenne mobile pondérée 40/30/20/10"}
        </span>
      </div>

      {/* LABEL OBLIGATOIRE « vue de dynamique » — condition de crédibilité :
          les courbes ne s'additionnent pas (chaque candidat à sa moyenne toutes
          hypothèses confondues), ce n'est pas un 1er tour simulé. */}
      <p
        className="mb-3 rounded-xl border px-3 py-2 text-[12px] leading-snug text-ink-soft"
        style={{ borderColor: "rgba(216,178,74,.35)", background: "rgba(216,178,74,.06)" }}
      >
        <span className="mono font-semibold text-gold">Vue de dynamique.</span>{" "}
        Chaque candidat est affiché à sa moyenne toutes hypothèses confondues. Les
        courbes ne s’additionnent pas et ne constituent pas un premier tour simulé.
      </p>

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
            {/* Clips circulaires partagés : pastille standard (11) et de tête (16). */}
            <clipPath id="pin-clip-sm">
              <circle cx={0} cy={0} r={11} />
            </clipPath>
            <clipPath id="pin-clip-lg">
              <circle cx={0} cy={0} r={16} />
            </clipPath>
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

          {/* Courbes.
              — Mode « tous instituts » : spline lissée, duo de tête plus épais.
              — Mode « institut unique » : segments droits entre vagues réelles
                (jamais de lissage trompeur) ; 1 seule vague ⇒ aucun trait, juste
                les points (rendus plus bas). Sous 3 vagues, on ne relie RIEN :
                points isolés, jamais un tracé qui suggère une tendance. */}
          {lines.map((l) => {
            const dimmed = isolated != null && isolated !== l.id;
            const highlighted = isolated === l.id;
            const lead = topTwo.has(l.id) && isolated == null;
            if (instituteMode) {
              if (l.points.length < 3) return null;
              const d = l.points
                .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                .join(" ");
              return (
                <path
                  key={l.id}
                  d={d}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={highlighted ? 2.6 : 1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="5 4"
                  opacity={dimmed ? 0.09 : 0.85}
                />
              );
            }
            return (
              <path
                key={l.id}
                d={smoothPath(l.points)}
                fill="none"
                stroke={l.color}
                strokeWidth={highlighted ? 3.4 : lead ? 3 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={dimmed ? 0.09 : 1}
                filter={highlighted ? "url(#halo)" : undefined}
              />
            );
          })}

          {/* Mode institut : marqueurs sur CHAQUE vague réelle (points isolés
              lisibles même à 1-2 mesures). */}
          {instituteMode &&
            lines.map((l) => {
              const dimmed = isolated != null && isolated !== l.id;
              return (
                <g key={`mk-${l.id}`} opacity={dimmed ? 0.12 : 1}>
                  {l.points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={3.6}
                      fill="#061426"
                      stroke={l.color}
                      strokeWidth={2}
                    />
                  ))}
                </g>
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

          {/* Pastilles de fin de courbe : photo ronde (fallback monogramme) + % ;
              le duo de tête est agrandi, cerclé d'or et badgé de son rang. */}
          {lines.map((l) => {
            const c = CANDIDATES[l.id];
            const dimmed = isolated != null && isolated !== l.id;
            const py = pinY[l.id] ?? l.last.y;
            const lead = topTwo.has(l.id) && isolated == null;
            const r = lead ? 16 : 11;
            const px = l.last.x + (lead ? 26 : 20);
            const showPhoto = c.photo && !failedPhotos.has(l.id);
            const rank = rankedIds.indexOf(l.id) + 1;
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
                  {lead && (
                    <circle cx={0} cy={0} r={r + 3} fill="#d8b24a" opacity={0.9} />
                  )}
                  <circle cx={0} cy={0} r={r} fill={c.color} />
                  {/* Monogramme sous la photo : reste visible si l'image échoue */}
                  <text
                    x={0}
                    y={lead ? 4.5 : 3.5}
                    textAnchor="middle"
                    className="mono"
                    fontSize={lead ? 11 : 8.5}
                    fontWeight={600}
                    fill="#04101f"
                  >
                    {c.mono}
                  </text>
                  {showPhoto && (
                    <image
                      href={c.photo}
                      x={-r}
                      y={-r}
                      width={r * 2}
                      height={r * 2}
                      clipPath={`url(#pin-clip-${lead ? "lg" : "sm"})`}
                      preserveAspectRatio="xMidYMid slice"
                      onError={() =>
                        setFailedPhotos((prev) => new Set(prev).add(l.id))
                      }
                    />
                  )}
                  <circle
                    cx={0}
                    cy={0}
                    r={r}
                    fill="none"
                    stroke={lead ? "#d8b24a" : "#061426"}
                    strokeWidth={lead ? 2 : 1.5}
                  />
                  {/* Badge de rang pour le duo de tête */}
                  {lead && (
                    <g transform={`translate(${r - 3} ${-(r - 3)})`}>
                      <circle cx={0} cy={0} r={7} fill="#04101f" stroke="#d8b24a" strokeWidth={1.2} />
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        className="mono"
                        fontSize={9}
                        fontWeight={700}
                        fill="#d8b24a"
                      >
                        {rank}
                      </text>
                    </g>
                  )}
                  <text
                    x={r + 5}
                    y={3.5}
                    className="mono"
                    fontSize={lead ? 13 : 11}
                    fontWeight={lead ? 700 : 600}
                    fill={dimmed ? "#5f748f" : lead ? "#ecd08a" : "#eaf1fb"}
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
