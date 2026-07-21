"use client";

import type { VigieData } from "@/lib/types";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import Hero from "./Hero";
import AggregateChart from "./AggregateChart";
import RankingCards from "./RankingCards";
import Hypotheses from "./Hypotheses";
import Duels from "./Duels";
import PollFeed from "./PollFeed";
import NewsTicker from "./NewsTicker";
import Methodology from "./Methodology";
import Footer from "./Footer";

export default function Dashboard({ data }: { data: VigieData }) {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const available = data.status === "available";

  return (
    <main className="mx-auto max-w-[1320px] px-4 tab:px-6">
      <Hero
        principalLabel={data.principalLabel}
        lastPollInstitute={data.lastPollInstitute}
        lastPollDates={data.lastPollDates}
        updatedAt={data.updatedAt}
        available={available}
      />

      {!available ? (
        <div className="panel my-10 p-8 text-center">
          <div className="eyebrow mb-3">Données indisponibles</div>
          <p className="text-ink-soft">
            La source (Wikipédia) est momentanément injoignable. Aucun chiffre
            n&apos;est affiché pour ne pas induire en erreur — réessayez dans un
            instant.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-8 pb-10">
          {data.partial && (
            <div
              className="mono rounded-xl border px-4 py-2.5 text-[12px]"
              style={{ borderColor: "rgba(216,178,74,.4)", background: "rgba(216,178,74,.06)", color: "#ecd08a" }}
            >
              ⚠ Données partielles : une partie du tableau Wikipédia n&apos;a pas pu
              être lue à ce cycle. Les chiffres affichés restent réels mais
              incomplets.
            </div>
          )}

          {/* Baromètre : courbe (principale) + fil des sondages (colonne droite en web) */}
          <section
            id="barometre"
            className="grid grid-cols-1 gap-4 web:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]"
          >
            <div className="panel p-4 tab:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="display text-lg font-bold text-ink">
                  Baromètre agrégé · 1er tour
                </h2>
                <span className="eyebrow hidden tab:block">
                  {data.principalLabel}
                </span>
              </div>
              <AggregateChart
                aggregates={data.aggregates}
                milestones={data.milestones}
                milestoneDates={data.milestoneDates}
                barometerPolls={data.barometerPolls}
                institutes={data.institutes}
                mobile={isMobile}
              />
            </div>
            <div className="space-y-4">
              <PollFeed polls={data.polls} />
              <NewsTicker />
            </div>
          </section>

          <div>
            <div className="eyebrow mb-3">
              Classement agrégé · tous les candidats
            </div>
            <RankingCards aggregates={data.aggregates} />
          </div>

          <div className="grid grid-cols-1 gap-4 web:grid-cols-2">
            <Hypotheses hypotheses={data.hypotheses} />
            <Duels duels={data.duels} />
          </div>

          <Methodology />
        </div>
      )}

      <Footer />
    </main>
  );
}
