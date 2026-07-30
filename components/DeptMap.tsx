"use client";

/**
 * Carte departementale du modele, seul composant construit de zero. Geometrie
 * derivee des contours IRIS 2022 (dissous par departement, simplifiee), au style
 * du site. Chaque departement est colore par le candidat en tete de la prevision,
 * avec sa couleur du site. Survol : departement, candidat en tete, score.
 */

import { useEffect, useState } from "react";

type Lead = { leadId: string; leadName: string; leadColor: string; leadScore: number };
type Geo = { viewBox: string; depts: Record<string, string> };

export default function DeptMap({ dept }: { dept: Record<string, Lead> }) {
  const [geo, setGeo] = useState<Geo | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    fetch("/dept_geo.json")
      .then((r) => r.json())
      .then(setGeo)
      .catch(() => setGeo(null));
  }, []);

  const leaders = Array.from(new Set(Object.values(dept).map((d) => d.leadId)))
    .map((id) => Object.values(dept).find((d) => d.leadId === id)!)
    .sort((a, b) => a.leadName.localeCompare(b.leadName));

  const h = hover ? dept[hover] : null;

  return (
    <section className="rounded-panel border border-panelBorder bg-panel p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Candidat en tête par département</h2>
        <span className="min-h-[16px] font-body text-[12px] tabular-nums text-ink-soft">
          {h ? `${hover} · ${h.leadName} ${h.leadScore.toFixed(1).replace(".", ",")} %` : "premier tour, hypothèse sélectionnée"}
        </span>
      </div>
      {geo ? (
        <svg viewBox={geo.viewBox} className="mx-auto block h-auto w-full" style={{ maxHeight: 500 }} role="img" aria-label="Carte départementale de la prévision">
          {Object.entries(geo.depts).map(([code, d]) => {
            const lead = dept[code];
            return (
              <path
                key={code}
                d={d}
                fill={lead ? lead.leadColor : "#16233f"}
                stroke="#050f1e"
                strokeWidth={0.7}
                opacity={hover && hover !== code ? 0.5 : 1}
                onMouseEnter={() => setHover(code)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer", transition: "opacity .1s" }}
              />
            );
          })}
        </svg>
      ) : (
        <div className="grid h-[300px] place-items-center font-body text-sm text-ink-faint">Carte indisponible.</div>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {leaders.map((l) => (
          <span key={l.leadId} className="inline-flex items-center gap-1.5 font-body text-[11.5px] text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.leadColor }} aria-hidden />
            {l.leadName}
          </span>
        ))}
      </div>
    </section>
  );
}
