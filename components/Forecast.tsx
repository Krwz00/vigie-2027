"use client";

/**
 * Vue Prevision (modele vigie), etape 2b. Reprend le langage visuel du site
 * (panneaux, cartes, puces, couleurs par candidat, Bricolage + Hanken) pour
 * afficher les quantites du modele : score en avant, fourchette au second plan,
 * probabilite de qualification, et le second tour. Selecteur d'hypothese de
 * candidature. Les composants de l'agregateur (RankingCards, Duels) sont couples
 * aux sondages, ils portent des deltas et des mini courbes et pas de fourchette ;
 * on en reprend donc le style, pas le code, pour representer fidelement le modele.
 */

import { useState } from "react";
import type { ForecastData, ForecastCandidate } from "@/lib/forecast";

function pct(n: number) {
  return n.toFixed(1).replace(".", ",");
}

function Row({ c, rank }: { c: ForecastCandidate; rank: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[rgba(16,35,63,0.4)] px-4 py-3">
      <span className="w-5 shrink-0 text-right font-body text-xs text-ink-faint">{rank}</span>
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
      <span className="min-w-0 flex-1 truncate font-body text-[15px] font-medium text-ink">{c.name}</span>
      <span className="shrink-0 text-right">
        <span className="font-body text-[22px] font-semibold tabular-nums text-ink">{pct(c.score)}</span>
        <span className="ml-1 font-body text-xs text-ink-faint">%</span>
      </span>
      <span className="hidden w-24 shrink-0 text-right font-body text-[11px] tabular-nums text-ink-faint tab:inline">
        {pct(c.lo)} à {pct(c.hi)}
      </span>
      <span
        className="hidden w-16 shrink-0 text-right font-body text-[11px] tabular-nums text-ink-label web:inline"
        title="probabilité de qualification au second tour"
      >
        {Math.round(c.pQualif * 100)}%
      </span>
    </div>
  );
}

export default function Forecast({ data }: { data: ForecastData | null }) {
  const [hi, setHi] = useState(0);

  const shell = (children: React.ReactNode) => (
    <div className="relative min-h-[70vh] bg-[radial-gradient(1300px_720px_at_82%_-12%,rgba(41,82,146,0.34),transparent_58%),linear-gradient(180deg,#061426,#050f1e_60%)] px-[clamp(16px,3vw,24px)] pb-16 pt-10">
      <div className="mx-auto max-w-[1040px]">{children}</div>
    </div>
  );

  if (!data) {
    return shell(<p className="font-body text-ink-soft">Prevision indisponible pour le moment.</p>);
  }

  const hyp = data.hypotheses[Math.min(hi, data.hypotheses.length - 1)];
  const cands = [...hyp.candidates].sort((a, b) => b.score - a.score);
  const duel = hyp.duel;

  return shell(
    <>
      <div className="mb-3 font-body text-[11px] uppercase tracking-[2.5px] text-gold">Modèle vigie</div>
      <h1 className="m-0 mb-4 font-display text-[clamp(28px,4.4vw,48px)] font-bold leading-[1.04] tracking-[-1px] text-ink">
        Prévision du premier tour
      </h1>
      <p className="m-0 mb-2 max-w-[640px] font-body text-[15.5px] leading-[1.6] text-ink-soft">{data.phrase}</p>
      <p className="m-0 mb-6 font-body text-[12.5px] text-ink-faint">
        À jour au {data.updatedAt} · {data.nSondages} sondages · fourchette calibrée sur les scrutins passés
      </p>

      {/* Selecteur d'hypothese de candidature */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-body text-[11px] uppercase tracking-[1.5px] text-ink-faint">Hypothèse</span>
        {data.hypotheses.map((hh, i) => {
          const on = i === hi;
          return (
            <button
              key={hh.id}
              onClick={() => setHi(i)}
              className={`rounded-full border px-3 py-1 font-body text-[12.5px] transition ${
                on ? "border-transparent bg-gradient-to-br from-gold-hover to-gold text-[#04101f]" : "border-white/[0.12] bg-white/[0.02] text-ink-soft hover:text-ink"
              }`}
              title={hh.label}
            >
              H{i + 1}
              <span className="ml-1.5 text-[10.5px] opacity-70">{hh.n} sond.</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 web:grid-cols-[1fr_360px]">
        {/* Classement, score en avant */}
        <section className="rounded-panel border border-panelBorder bg-panel p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Premier tour</h2>
            <span className="hidden font-body text-[11px] text-ink-faint web:inline">score · fourchette · P(qualif)</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {cands.map((c, i) => (
              <Row key={c.id} c={c} rank={i + 1} />
            ))}
          </div>
        </section>

        {/* Second tour */}
        <section className="rounded-panel border border-panelBorder bg-panel p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Second tour</h2>
          {duel ? (
            <div className="flex flex-col gap-3">
              {[duel.nonRN, duel.lePen].map((s) => {
                const win = duel.vainqueur === s.name;
                return (
                  <div key={s.id} className="rounded-2xl border border-white/[0.06] bg-[rgba(16,35,63,0.4)] px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                      <span className="flex-1 truncate font-body text-[15px] font-medium text-ink">{s.name}</span>
                      <span className="font-body text-[24px] font-semibold tabular-nums" style={{ color: win ? s.color : undefined }}>
                        {pct(s.score)}
                      </span>
                      <span className="font-body text-xs text-ink-faint">%</span>
                    </div>
                    <div className="mt-1 pl-[22px] font-body text-[11px] tabular-nums text-ink-faint">
                      fourchette {pct(s.lo)} à {pct(s.hi)}
                    </div>
                  </div>
                );
              })}
              <p className="m-0 font-body text-[11.5px] leading-[1.5] text-ink-faint">
                Point central entre matrices de report plausibles. Les reports ne se reproduisent pas d'une
                élection à l'autre, la fourchette est la réponse honnête.
              </p>
            </div>
          ) : (
            <p className="font-body text-sm text-ink-soft">Pas de duel avec le Rassemblement national dans cette hypothèse.</p>
          )}
        </section>
      </div>

      <p className="mt-4 font-body text-[11px] text-ink-faint">
        Prévision, source modèle vigie. L'agrégateur (onglet Sondages) montre les sondages bruts, source Wikipédia.
      </p>
    </>
  );
}
