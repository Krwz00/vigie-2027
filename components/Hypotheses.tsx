"use client";

import { useState } from "react";
import type { Hypothesis } from "@/lib/types";
import { CANDIDATES, resolveCandidateId } from "@/lib/candidates";
import Avatar from "./Avatar";

function candidateFor(name: string) {
  const id = resolveCandidateId(name);
  return id ? CANDIDATES[id] : null;
}

/** Hypothèses de 1er tour : sélecteur de configurations + barres horizontales. */
export default function Hypotheses({ hypotheses }: { hypotheses: Hypothesis[] }) {
  const [active, setActive] = useState(0);
  const h = hypotheses[active];
  const max = Math.max(...h.results.map((r) => r.value), 1);

  return (
    <section id="hypotheses" className="panel p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="display text-lg font-bold text-ink">Hypothèses de 1er tour</h2>
        <span className="eyebrow">{hypotheses.length} configurations</span>
      </div>

      {/* Sélecteur de configurations */}
      <div
        className="mb-4 flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Configurations testées"
      >
        {hypotheses.map((hyp, i) => (
          <button
            key={hyp.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className="chip tap"
            data-active={i === active}
            onClick={() => setActive(i)}
          >
            {hyp.label}
            <span className="mono text-ink-faint">n={hyp.n}</span>
          </button>
        ))}
      </div>

      {/* De qui est candidat ? — trombinoscope de la configuration sélectionnée */}
      <div className="mb-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
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

      <p className="mb-4 text-[13px] leading-relaxed text-ink-soft">{h.note}</p>

      {/* Barres horizontales par candidat (avec tête) */}
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
