"use client";

import { useState } from "react";
import type { Hypothesis } from "@/lib/types";
import { CANDIDATES, resolveCandidateId } from "@/lib/candidates";
import Avatar from "./Avatar";

function candidateFor(name: string) {
  const id = resolveCandidateId(name);
  return id ? CANDIDATES[id] : null;
}

/** Hypothèses de 1er tour : dropdown de TOUTES les configs réellement sondées,
 *  barres agrégées dans la config + instituts/dates l'ayant testée. */
export default function Hypotheses({ hypotheses }: { hypotheses: Hypothesis[] }) {
  const [active, setActive] = useState(0);
  const h = hypotheses[active];
  if (!h) return null;
  const max = Math.max(...h.results.map((r) => r.value), 1);

  return (
    <section id="hypotheses" className="panel p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="display text-lg font-bold text-ink">Hypothèses de 1er tour</h2>
        <span className="eyebrow">{hypotheses.length} configurations</span>
      </div>

      {/* Sélecteur — toutes les configurations testées, générées depuis les données */}
      <label htmlFor="hyp-select" className="eyebrow mb-1.5 block">
        Configuration testée
      </label>
      <select
        id="hyp-select"
        className="select tap mb-4 w-full"
        value={active}
        onChange={(e) => setActive(Number(e.target.value))}
      >
        {hypotheses.map((hyp, i) => (
          <option key={hyp.id} value={i}>
            {hyp.label} · {hyp.n} vague{hyp.n > 1 ? "s" : ""}
          </option>
        ))}
      </select>

      {/* Qui a posé la question : instituts + dates ayant testé cette hypothèse */}
      <div className="mb-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <div className="eyebrow mb-2">Testée par</div>
        <ul className="space-y-1">
          {h.sources.map((s) => (
            <li key={s.institute} className="flex gap-2 text-[12px]">
              <span className="mono w-24 shrink-0 font-semibold text-ink">
                {s.institute}
              </span>
              <span className="text-ink-soft">{s.dates}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trombinoscope des candidats testés dans ce scénario */}
      <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <div className="eyebrow mb-2">Candidats testés dans ce scénario</div>
        <div className="flex flex-wrap gap-2">
          {h.results.map((r) => {
            const c = candidateFor(r.name);
            return (
              <div key={r.name} className="flex items-center gap-1.5">
                {c ? (
                  <Avatar candidate={c} size={22} />
                ) : (
                  <span
                    className="inline-block h-[22px] w-[22px] rounded-full"
                    style={{ background: r.color }}
                  />
                )}
                <span className="text-[12px] text-ink-soft">{r.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barres horizontales par candidat (agrégées DANS la config) */}
      <div className="space-y-2">
        {h.results.map((r) => {
          const c = candidateFor(r.name);
          return (
            <div key={r.name} className="flex items-center gap-2.5">
              {c ? (
                <Avatar candidate={c} size={26} />
              ) : (
                <span
                  className="inline-block h-[26px] w-[26px] shrink-0 rounded-full"
                  style={{ background: r.color }}
                />
              )}
              <div className="w-20 shrink-0 truncate text-[13px] text-ink-soft">
                {r.name}
              </div>
              <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-white/[0.04]">
                <div
                  className="flex h-full items-center rounded-md pl-2 transition-all"
                  style={{
                    width: `${(r.value / max) * 100}%`,
                    background: `linear-gradient(90deg, ${r.color}dd, ${r.color}55)`,
                    minWidth: 34,
                  }}
                >
                  <span className="mono text-[11px] font-semibold text-[#04101f]">
                    {r.value.toFixed(1).replace(/\.0$/, "")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
