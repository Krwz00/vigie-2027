"use client";

import { useMemo, useState } from "react";
import type { Poll } from "@/lib/types";
import { CANDIDATES } from "@/lib/candidates";
import SeenBeacon from "./SeenBeacon";

// Puce couleur par institut (match insensible à la casse ; fallback hash).
const INSTITUTE_COLORS: [string, string][] = [
  ["elabe", "#e5484d"],
  ["opinionway", "#3f6fd6"],
  ["ifop", "#23c4a8"],
  ["cluster17", "#d8b24a"],
  ["harris", "#ec6a9c"],
  ["odoxa", "#9b8cff"],
  ["ipsos", "#6f9bff"],
  ["toluna", "#ec6a9c"],
  ["csa", "#7fb3e0"],
  ["bva", "#3fae6b"],
];

function instituteColor(name: string): string {
  const n = name.toLowerCase();
  const hit = INSTITUTE_COLORS.find(([k]) => n.includes(k));
  if (hit) return hit[1];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 55% 62%)`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

/** Fil des sondages publiés — tri antéchronologique, filtrable par institut. */
export default function PollFeed({ polls }: { polls: Poll[] }) {
  const [institute, setInstitute] = useState<string>("all");

  const institutes = useMemo(
    () => [...new Set(polls.map((p) => p.institute))].sort((a, b) => a.localeCompare(b, "fr")),
    [polls],
  );
  const shown = useMemo(
    () => (institute === "all" ? polls : polls.filter((p) => p.institute === institute)),
    [polls, institute],
  );

  return (
    <section id="sondages" className="panel flex flex-col p-5">
      <SeenBeacon />
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="display text-lg font-bold text-ink">Sondages publiés</h2>
        <span className="eyebrow">{shown.length} enquêtes</span>
      </div>

      {/* Filtre par institut */}
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="inst-filter" className="eyebrow shrink-0">
          Institut
        </label>
        <select
          id="inst-filter"
          value={institute}
          onChange={(e) => setInstitute(e.target.value)}
          className="mono tap w-full rounded-lg border border-white/10 bg-[#0b1a30] px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-gold"
        >
          <option value="all">Tous les instituts ({polls.length})</option>
          {institutes.map((inst) => (
            <option key={inst} value={inst}>
              {inst} ({polls.filter((p) => p.institute === inst).length})
            </option>
          ))}
        </select>
      </div>

      {shown.length === 0 && (
        <div className="mono py-6 text-center text-[12px] text-ink-faint">
          Aucun sondage pour cet institut dans la fenêtre récente.
        </div>
      )}

      <ul className="scroll-slim -mr-2 max-h-[560px] space-y-3 overflow-y-auto pr-2">
        {shown.map((p, i) => {
          const topline = Object.entries(p.scores)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 4);
          return (
            <li
              key={`${p.institute}-${p.publishedAt}-${i}`}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: instituteColor(p.institute) }}
                  />
                  <span className="text-sm font-semibold text-ink">
                    {p.institute}
                  </span>
                  {p.isNew && (
                    <span
                      className="mono rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-[#04101f]"
                      style={{ background: "#d8b24a" }}
                    >
                      NOUVEAU
                    </span>
                  )}
                </div>
                <span className="mono text-[11px] text-ink-faint">
                  {fmtDate(p.publishedAt)}
                </span>
              </div>

              <div className="mt-0.5 text-[11px] text-ink-faint">{p.sponsor}</div>

              {/* Top-line */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {topline.map(([id, val]) => {
                  const c = CANDIDATES[id as keyof typeof CANDIDATES];
                  return (
                    <span
                      key={id}
                      className="mono flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]"
                      style={{ background: `${c.color}1f`, color: c.color }}
                    >
                      {c.last}
                      <b className="text-ink">{val}</b>
                    </span>
                  );
                })}
              </div>

              <div className="mono mt-2 flex items-center gap-2 text-[10px] text-ink-faint">
                <span>Hyp. {p.hypothesis}</span>
                <span>·</span>
                <span>
                  terrain {fmtDate(p.fieldStart)}–{fmtDate(p.fieldEnd)}
                </span>
                <span>·</span>
                <span>n={p.sampleSize.toLocaleString("fr-FR")}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
