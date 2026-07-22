"use client";

/**
 * Reproduction FIDÈLE de la maquette /Users/alpha/Desktop/Vigie.html (Claude
 * Design) : mêmes balises, mêmes styles inline, même graphe SVG, même canvas
 * animé — seules les valeurs en dur sont remplacées par les vraies données du
 * projet (VigieData). Les classes/keyframes (.vnav/.vchip/.vcard/.vscroll,
 * vpulse/vrise/vaurora) sont reprises telles quelles dans globals.css.
 *
 * Seule création par rapport à la maquette : l'état de fraîcheur (candidat
 * « daté »), stylé avec les tokens de la maquette (atténuation + « datant du
 * <date> », relégué après les candidats à jour).
 */

import { createElement as h, useEffect, useRef, useState, type ReactNode } from "react";
import type { CandidateId, VigieData } from "@/lib/types";
import { CANDIDATES } from "@/lib/candidates";
import { buildRawInstituteSeries } from "@/lib/aggregate";

type Device = "web" | "tablet" | "mobile";

// ── helpers repris de la maquette ──
function soft(hex: string, amt = 42): string {
  const s = hex.replace("#", "");
  const r = Math.min(255, parseInt(s.slice(0, 2), 16) + amt);
  const g = Math.min(255, parseInt(s.slice(2, 4), 16) + amt);
  const b = Math.min(255, parseInt(s.slice(4, 6), 16) + amt);
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const fmtPct = (v: number) => String(v).replace(".", ",") + "%";
const fmtNum = (v: number) => String(v).replace(".", ",");

const MONTHS_ABBR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MONTHS_UP = ["JANV", "FÉV", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];
function d3(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}
const frDay = (iso: string) => (iso ? `${d3(iso).d} ${MONTHS_ABBR[d3(iso).m - 1]}` : "");
const frDayYear = (iso: string) => (iso ? `${d3(iso).d} ${MONTHS_ABBR[d3(iso).m - 1]} ${d3(iso).y}` : "");
const frUpper = (iso: string) => (iso ? `${String(d3(iso).d).padStart(2, "0")} ${MONTHS_UP[d3(iso).m - 1]} ${d3(iso).y}` : "");
function frRange(start: string, end: string) {
  if (!start || !end) return frDayYear(end || start);
  const a = d3(start), b = d3(end);
  if (a.m === b.m && a.y === b.y) return `${a.d}-${b.d} ${MONTHS_ABBR[b.m - 1]} ${b.y}`;
  return `${a.d} ${MONTHS_ABBR[a.m - 1]} - ${b.d} ${MONTHS_ABBR[b.m - 1]} ${b.y}`;
}

interface Cand {
  id: CandidateId;
  last: string;
  name: string;
  party: string;
  mono: string;
  color: string;
  photo?: string;
  s: (number | null)[];
  cur: number;
  delta: number;
  stale: boolean;
  lastPollDate: string;
}

export default function Vigie({ data }: { data: VigieData }) {
  const [device, setDevice] = useState<Device>("web");
  const [active, setActive] = useState<CandidateId | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [source, setSource] = useState<string>("all");
  const [hypoIdx, setHypoIdx] = useState<number>(0);
  const [logoOk, setLogoOk] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // device (après montage pour éviter tout décalage d'hydratation)
  useEffect(() => {
    const detect = (): Device => {
      const w = window.innerWidth;
      return w < 760 ? "mobile" : w < 1180 ? "tablet" : "web";
    };
    const onR = () => setDevice(detect());
    onR();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // ── canvas de fond animé (onde + particules), repris de la maquette ──
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let dpr = 1, raf = 0;
    let parts: { x: number; off: number; spread: number; r: number; ph: number; sp: number; c: string }[] = [];
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(1, cv.clientWidth * dpr);
      cv.height = Math.max(1, cv.clientHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    const draw = (t: number) => {
      const W = cv.clientWidth, H = cv.clientHeight;
      if (W && H) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        const cyBase = H * 0.4, amp = H * 0.13, half = H * 0.16, freq = 3.0 / W, sp = t * 0.00016;
        const wave = (x: number) => cyBase + Math.sin(x * freq + sp) * amp + Math.sin(x * freq * 0.5 + sp * 1.7) * amp * 0.4;
        ctx.save();
        if ("filter" in ctx) (ctx as CanvasRenderingContext2D).filter = "blur(46px)";
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, "rgba(36,92,210,0)");
        grad.addColorStop(0.24, "rgba(48,112,226,0.5)");
        grad.addColorStop(0.54, "rgba(66,152,236,0.55)");
        grad.addColorStop(0.8, "rgba(44,104,216,0.4)");
        grad.addColorStop(1, "rgba(36,92,210,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, wave(0) - half);
        for (let x = 0; x <= W; x += 24) ctx.lineTo(x, wave(x) - half);
        for (let x = W; x >= 0; x -= 24) ctx.lineTo(x, wave(x) + half);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        if (!parts.length) {
          const pal = ["64,120,232", "54,150,235", "96,172,240"];
          for (let i = 0; i < 150; i++) {
            const c = i % 8 === 0 ? "216,178,74" : pal[i % pal.length];
            parts.push({ x: (i * 97 % 1000) / 1000, off: ((i * 53) % 200) / 100 - 1, spread: ((i * 31) % 100) / 100, r: ((i * 17) % 180) / 100 + 0.4, ph: ((i * 13) % 628) / 100, sp: ((i * 7) % 15) / 100 + 0.03, c });
          }
        }
        ctx.globalCompositeOperation = "lighter";
        for (const p of parts) {
          const px = (p.x + t * 0.0000115 * p.sp * 60) % 1;
          const x = px * W;
          const y = wave(x) + p.off * half * (0.6 + p.spread * 1.5);
          const a = (0.22 + 0.34 * Math.sin(t * 0.0015 + p.ph)) * (1 - Math.abs(p.off) * 0.4);
          if (a <= 0.01) continue;
          ctx.fillStyle = "rgba(" + p.c + "," + a.toFixed(3) + ")";
          ctx.beginPath();
          ctx.arc(x, y, p.r, 0, 6.283);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── données réelles → formes de la maquette ──
  // Axe temporel : démarre en janvier 2025 (jamais 2024). Les données réelles
  // commencent de toute façon en 2026 ; ce plancher garde l'axe propre.
  const cut = Math.max(0, data.milestoneDates.findIndex((d) => d >= "2025-01-01"));
  const dates = data.milestones.slice(cut);
  const baseAgg = data.aggregates;
  const instAgg =
    source === "all"
      ? null
      : buildRawInstituteSeries(data.barometerPolls, source, data.milestoneDates, data.milestones);
  const activeAgg = instAgg ?? baseAgg;

  const cands: Cand[] = activeAgg.map((a) => {
    const c = CANDIDATES[a.candidate];
    return {
      id: a.candidate,
      last: c.last,
      name: c.name,
      party: c.party,
      mono: c.mono,
      color: c.color,
      photo: c.photo,
      s: a.series.slice(cut).map((p) => p.value),
      cur: a.current,
      delta: a.delta,
      stale: source === "all" ? a.stale : false,
      lastPollDate: a.lastPollDate,
    };
  });

  const byRank = [...cands].sort((x, y) => (x.stale !== y.stale ? (x.stale ? 1 : -1) : y.cur - x.cur));
  const chartCands = [...cands].sort((x, y) => y.cur - x.cur).slice(0, 10);

  const cfgMap: Record<Device, Record<string, string>> = {
    web: { mainDir: "row", feedW: "360px", feedH: "540px", maxW: "1340px", lbCols: "repeat(3,minmax(0,1fr))", splitDir: "row", methodoCols: "repeat(3,minmax(0,1fr))", navDisplay: "flex", sparkDisplay: "block" },
    tablet: { mainDir: "column", feedW: "100%", feedH: "320px", maxW: "100%", lbCols: "repeat(2,minmax(0,1fr))", splitDir: "row", methodoCols: "repeat(2,minmax(0,1fr))", navDisplay: "flex", sparkDisplay: "block" },
    mobile: { mainDir: "column", feedW: "100%", feedH: "300px", maxW: "100%", lbCols: "minmax(0,1fr)", splitDir: "column", methodoCols: "minmax(0,1fr)", navDisplay: "none", sparkDisplay: "none" },
  };
  const cfg = cfgMap[device];

  const sources = [{ v: "all", label: "Tous les instituts (moyenne agrégée)" }, ...data.institutes.map((i) => ({ v: i, label: i }))];

  const feed = data.polls.slice(0, 12).map((p) => {
    const entries = (Object.entries(p.scores) as [CandidateId, number][])
      .filter(([, v]) => typeof v === "number")
      .sort((a, b) => b[1] - a[1]);
    const topId = entries[0]?.[0];
    return {
      color: topId ? CANDIDATES[topId].color : "#d8b24a",
      dateLabel: frUpper(p.fieldEnd),
      isNew: !!p.isNew,
      institute: p.institute,
      sponsor: p.sponsor && p.sponsor !== "—" ? p.sponsor : "",
      lead: entries.slice(0, 4).map(([id, v]) => `${CANDIDATES[id].last} ${fmtNum(v)}`).join(" / "),
      meta: `terrain ${frRange(p.fieldStart, p.fieldEnd)}${p.sampleSize ? ` / n=${p.sampleSize.toLocaleString("fr-FR")}` : ""}`,
    };
  });

  const hypotheses = data.hypotheses.map((hy) => ({
    label: hy.label,
    note: "Testée par " + hy.sources.map((s) => `${s.institute} (${s.dates})`).join(" · ") + ".",
    results: hy.results.map((r) => [r.name, r.value, r.color] as [string, number, string]),
  }));
  const curHy = hypotheses[Math.min(hypoIdx, hypotheses.length - 1)] ?? { label: "", note: "", results: [] };
  const hmax = Math.max(1, ...curHy.results.map((r) => r[1]));

  const duels = data.duels.map((d) => ({
    an: d.a.name, av: d.a.value, ac: d.a.color,
    bn: d.b.name, bv: d.b.value, bc: d.b.color,
    sources: d.sources,
  }));

  // ── graphe SVG (porté À L'IDENTIQUE, avec gestion des nulls = fraîcheur) ──
  const chart = makeChart(chartCands, dates, device, active, hoverIdx, setActive, setHoverIdx, source);

  const st = (o: React.CSSProperties) => o;

  // carte candidat — `big` = podium (2 premiers), plus grande. Marquage « daté »
  // explicite (pastille or) pour les candidats hors fenêtre de fraîcheur.
  const renderCand = (c: Cand, rank: number, big: boolean): ReactNode => {
    const up = c.delta > 0, flat = c.delta === 0;
    const av = big ? 62 : 44;
    return h("div", { key: c.id, className: "vcard", onClick: () => setActive(active === c.id ? null : c.id), style: st({ cursor: "pointer", display: "flex", alignItems: "center", gap: big ? 16 : 13, padding: big ? "18px 20px" : "13px 15px", borderRadius: big ? 16 : 14, border: `1px solid ${active === c.id ? c.color : big ? "rgba(216,178,74,0.35)" : "rgba(255,255,255,0.08)"}`, background: active === c.id ? "rgba(255,255,255,0.055)" : big ? "linear-gradient(180deg, rgba(216,178,74,0.06), rgba(16,35,63,0.5))" : "rgba(16,35,63,0.4)", opacity: c.stale ? 0.55 : 1 }) },
      h("div", { style: st({ fontFamily: "var(--font-body)", fontSize: big ? 15 : 12, fontWeight: big ? 700 : 400, color: big ? "#d8b24a" : "#5f748f", width: big ? 22 : 16 }) }, String(rank).padStart(2, "0")),
      h("div", { style: st({ position: "relative", width: av, height: av, flex: `0 0 ${av}px`, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${soft(c.color)}, ${c.color})`, display: "grid", placeItems: "center", color: "#08152a", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: big ? 17 : 13, boxShadow: `0 0 0 1.5px rgba(255,255,255,0.1), 0 6px 16px -6px ${c.color}`, overflow: "hidden" }) },
        h("span", null, c.mono),
        c.photo ? h("img", { src: c.photo, alt: c.name, onError: (e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).style.display = "none"; }, style: st({ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }) }) : null
      ),
      h("div", { style: st({ minWidth: 0, flex: 1 }) },
        h("div", { style: st({ fontWeight: 700, fontSize: big ? 17 : 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }) }, c.name),
        h("div", { style: st({ fontSize: big ? 12 : 11, color: "#8ba0bd", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }) }, c.party)
      ),
      h("div", { style: st({ opacity: 0.85, display: cfg.sparkDisplay }) }, spark(c.s, c.color)),
      h("div", { style: st({ textAlign: "right", minWidth: big ? 78 : 60 }) },
        h("div", { style: st({ fontFamily: "var(--font-body)", fontSize: big ? 30 : 20, fontWeight: 600, color: c.color, lineHeight: 1 }) }, fmtPct(c.cur)),
        c.stale
          ? h("div", { style: st({ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 5, marginTop: 5 }) },
              h("span", { style: st({ padding: "1px 6px", borderRadius: 999, border: "1px solid rgba(216,178,74,0.4)", background: "rgba(216,178,74,0.1)", fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 700, letterSpacing: ".8px", color: "#d8b24a" }) }, "DATÉ"),
              h("span", { style: st({ fontFamily: "var(--font-body)", fontSize: 9.5, color: "#8ba0bd" }) }, frDay(c.lastPollDate))
            )
          : h("div", { style: st({ fontFamily: "var(--font-body)", fontSize: big ? 12 : 10.5, color: flat ? "#5f748f" : up ? "#3fd08a" : "#e5686b", marginTop: 4 }) }, `${flat ? "=" : up ? "▲" : "▼"} ${c.delta > 0 ? "+" : c.delta < 0 ? "−" : ""}${Math.abs(c.delta)} pt`)
      )
    );
  };
  const podiumCols = device === "mobile" ? "minmax(0,1fr)" : "repeat(2,minmax(0,1fr))";

  // Logo Le Millénaire (public/brand/logo-millenaire.png) blanchi pour le fond
  // sombre ; fallback propre « M » or si le fichier est absent.
  const logoMark = (px: number): ReactNode =>
    logoOk
      ? h("img", { src: "/brand/logo-millenaire.png", alt: "Le Millénaire", onError: () => setLogoOk(false), style: st({ height: px, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.95 }) })
      : h("span", { style: st({ width: px, height: px, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(145deg,#ecd08a,#d8b24a)", color: "#04101f", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: Math.round(px * 0.5) }) }, "M");

  return h(
    "div",
    { style: st({ position: "relative", minHeight: "100vh", background: "radial-gradient(1300px 720px at 82% -12%, rgba(41,82,146,0.34), transparent 58%), radial-gradient(1000px 640px at -8% 8%, rgba(216,178,74,0.07), transparent 55%), linear-gradient(180deg,#061426,#050f1e 60%)", overflow: "hidden", paddingBottom: 64 }) },
    h("canvas", { ref: canvasRef, id: "vbg", style: st({ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none", display: "block" }) }),
    h("div", { style: st({ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(620px 420px at 24% 16%, rgba(216,178,74,0.11), transparent 62%), radial-gradient(700px 480px at 84% 26%, rgba(58,108,220,0.18), transparent 64%)", mixBlendMode: "screen", filter: "blur(8px)", animation: "vaurora 26s ease-in-out infinite alternate" }) }),

    // HEADER
    h("header", { style: st({ position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(14px)", background: "linear-gradient(180deg, rgba(6,17,33,0.9), rgba(6,17,33,0.62))", borderBottom: "1px solid rgba(216,178,74,0.16)" }) },
      h("div", { style: st({ maxWidth: 1340, margin: "0 auto", padding: "12px clamp(16px,3vw,24px)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }) },
        h("div", { style: st({ display: "flex", alignItems: "center", gap: 11 }) },
          logoMark(40),
          h("div", { style: st({ width: 1, height: 26, background: "rgba(216,178,74,0.35)" }) }),
          h("div", { style: st({ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 700, letterSpacing: "1px" }) }, "VIGIE 2027")
        ),
        h("nav", { style: st({ display: cfg.navDisplay, gap: 24, marginLeft: 14 }) },
          [["#barometre", "Baromètre"], ["#candidats", "Candidats"], ["#hypotheses", "Hypothèses"], ["#sondages", "Sondages"], ["#methodologie", "Méthodologie"]].map(([href, label]) =>
            h("a", { key: href, href, className: "vnav", style: st({ fontSize: 13.5, color: "#b9c7dc" }) }, label)
          )
        ),
        h("div", { style: st({ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }) },
          h("div", { style: st({ fontFamily: "var(--font-body)", fontSize: 11, color: "#cdd9ea" }) },
            h("span", { style: st({ color: "#8ba0bd" }) }, "Dernier sondage : "),
            data.lastPollInstitute ? `${data.lastPollInstitute}, ${lastRange(data.lastPollDates)}` : "—"
          ),
          h("div", { style: st({ fontFamily: "var(--font-body)", fontSize: 11, color: "#8ba0bd" }) }, `À jour au ${frDayYear(data.updatedAt.slice(0, 10))}`)
        )
      )
    ),

    h("div", { style: st({ position: "relative", zIndex: 1, maxWidth: cfg.maxW, margin: "28px auto 0", padding: "0 clamp(16px,3vw,24px)" }) },
      // HERO
      h("div", { style: st({ padding: "6px 0 24px" }) },
        h("div", { style: st({ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: "2.5px", color: "#d8b24a", textTransform: "uppercase", marginBottom: 14 }) }, "Présidentielle française 2027"),
        h("h1", { style: st({ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(30px,5vw,56px)", lineHeight: 1.02, margin: "0 0 14px", letterSpacing: "-1.2px", textWrap: "balance" } as React.CSSProperties) }, "Tous les sondages de la présidentielle sur", h("br"), h("span", { style: st({ color: "#d8b24a" }) }, "une seule courbe.")),
        h("p", { style: st({ maxWidth: 580, margin: 0, color: "#a2b4cd", fontSize: 15.5, lineHeight: 1.55 }) }, "La moyenne agrégée de tous les instituts, posée sur chaque sondage brut. Survolez la courbe pour lire le détail, point par point.")
      ),

      // BAROMÈTRE — pleine largeur, le feed est passé dessous
      h("section", { id: "barometre", style: st({ position: "relative", background: "linear-gradient(180deg, rgba(17,37,66,0.85), rgba(9,21,40,0.9))", border: "1px solid rgba(216,178,74,0.15)", borderRadius: 18, padding: "18px 18px 14px", boxShadow: "0 24px 60px -30px rgba(0,0,0,0.7)" }) },
        h("div", { style: st({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 2 }) },
          h("div", { style: st({ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }) }, "Baromètre du 1er tour"),
          h("div", { style: st({ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }) },
            selectEl(source, (e) => { setSource(e); setHoverIdx(null); setActive(null); }, sources.map((s) => [s.v, s.label]), "7px 32px 7px 12px", 12),
            h("div", { style: st({ fontFamily: "var(--font-body)", fontSize: 10.5, color: "#5f748f" }) }, `${dates[0] ?? ""} → ${dates[dates.length - 1] ?? ""}`)
          )
        ),
        chart,
        h("div", { style: st({ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }) },
          chartCands.map((c) => {
            const dim = active && active !== c.id;
            return h("button", { key: c.id, className: "vchip", onClick: () => setActive(active === c.id ? null : c.id), style: st({ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: "4px 11px 4px 5px", borderRadius: 999, border: `1px solid ${active === c.id ? c.color : "rgba(255,255,255,0.12)"}`, background: active === c.id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)", opacity: dim ? 0.4 : 1 }) },
              h("span", { style: st({ width: 19, height: 19, borderRadius: "50%", background: c.color, color: "#08152a", fontFamily: "var(--font-body)", fontSize: 8.5, fontWeight: 600, display: "grid", placeItems: "center" }) }, c.mono),
              h("span", { style: st({ fontSize: 12, color: "#dbe4f0" }) }, c.last),
              h("span", { style: st({ fontFamily: "var(--font-body)", fontSize: 12, color: c.color, fontWeight: 600 }) }, fmtPct(c.cur))
            );
          })
        )
      ),

      // FEED — pleine largeur, sous le graphe, défilement horizontal des cartes
      h("section", { id: "sondages", style: st({ marginTop: 16, background: "linear-gradient(180deg, rgba(17,37,66,0.8), rgba(9,21,40,0.85))", border: "1px solid rgba(216,178,74,0.15)", borderRadius: 18, padding: 16 }) },
        h("div", { style: st({ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }) },
          h("span", { style: st({ width: 7, height: 7, borderRadius: "50%", background: "#d8b24a", boxShadow: "0 0 8px #d8b24a", animation: "vpulse 1.6s infinite" }) }),
          h("div", { style: st({ fontFamily: "var(--font-body)", fontSize: 10.5, letterSpacing: "2px", color: "#d8b24a", textTransform: "uppercase" }) }, "Derniers sondages")
        ),
        h("div", { className: "vscroll", style: st({ display: "flex", gap: 11, overflowX: "auto", paddingBottom: 6 }) },
          feed.map((f, i) =>
            h("article", { key: i, className: "vcard", style: st({ position: "relative", flex: "0 0 300px", maxWidth: 300, border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${f.color}`, borderRadius: 11, padding: "12px 13px", background: "rgba(255,255,255,0.022)", animation: "vrise .4s ease both" }) },
              h("div", { style: st({ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }) },
                h("span", { style: st({ fontFamily: "var(--font-body)", fontSize: 10.5, color: "#8ba0bd", letterSpacing: ".5px" }) }, f.dateLabel),
                f.isNew ? h("span", { style: st({ fontFamily: "var(--font-body)", fontSize: 8.5, letterSpacing: "1px", color: "#08152a", background: "#d8b24a", padding: "2px 6px", borderRadius: 4, fontWeight: 600, boxShadow: "0 0 10px rgba(216,178,74,0.4)" }) }, "NOUVEAU") : null
              ),
              h("div", { style: st({ display: "flex", alignItems: "center", gap: 8 }) },
                h("span", { style: st({ width: 8, height: 8, borderRadius: 2, background: f.color, flex: "0 0 8px" }) }),
                h("span", { style: st({ fontWeight: 700, fontSize: 14, color: "#eef3fa" }) }, f.institute)
              ),
              f.sponsor ? h("div", { style: st({ fontSize: 11.5, color: "#93a6c2", margin: "2px 0 8px 16px" }) }, f.sponsor) : null,
              h("div", { style: st({ fontSize: 12.5, color: "#c9d5e6", lineHeight: 1.5, marginTop: f.sponsor ? 0 : 6 }) }, f.lead),
              h("div", { style: st({ fontFamily: "var(--font-body)", fontSize: 10, color: "#5f748f", marginTop: 7 }) }, f.meta)
            )
          )
        )
      ),

      // LEADERBOARD
      h("section", { id: "candidats", style: st({ marginTop: 34 }) },
        h("div", { style: st({ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16, flexWrap: "wrap" }) },
          h("h2", { style: st({ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, margin: 0 }) }, "Candidats"),
          h("span", { style: st({ fontSize: 11, color: "#5f748f", marginLeft: "auto", fontFamily: "var(--font-body)" }) }, "Δ vs mois préc.")
        ),
        // Podium : les 2 premiers en grand
        h("div", { style: st({ display: "grid", gridTemplateColumns: podiumCols, gap: 12, marginBottom: 12 }) },
          byRank.slice(0, 2).map((c, i) => renderCand(c, i + 1, true))
        ),
        // Suite du classement
        h("div", { style: st({ display: "grid", gridTemplateColumns: cfg.lbCols, gap: 11 }) },
          byRank.slice(2).map((c, i) => renderCand(c, i + 3, false))
        ),
        h("div", { style: st({ marginTop: 11, fontSize: 11, color: "#5f748f" }) }, "Candidats à jour d’abord, puis candidats non testés récemment (atténués). Marine Le Pen et Jordan Bardella relèvent d’hypothèses de candidature alternatives.")
      ),

      // HYPOTHESES + DUELS
      h("div", { id: "hypotheses", style: st({ display: "flex", gap: 16, flexDirection: cfg.splitDir as "row" | "column", marginTop: 34 }) },
        h("section", { style: st({ flex: "1 1 0", minWidth: 0, background: "linear-gradient(180deg, rgba(17,37,66,0.55), rgba(9,21,40,0.6))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 20 }) },
          h("div", { style: st({ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }) },
            h("h2", { style: st({ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600, margin: 0 }) }, "Hypothèses du 1er tour")
          ),
          h("div", { style: st({ margin: "14px 0 16px" }) }, selectEl(String(hypoIdx), (v) => setHypoIdx(Number(v)), hypotheses.map((hy, i) => [String(i), hy.label]), "8px 34px 8px 13px", 12.5)),
          h("div", { style: st({ fontSize: 12, color: "#93a6c2", marginBottom: 16, lineHeight: 1.5 }) }, curHy.note),
          h("div", { style: st({ display: "flex", flexDirection: "column", gap: 9 }) },
            curHy.results.map((r, i) =>
              h("div", { key: i, style: st({ display: "flex", alignItems: "center", gap: 12 }) },
                h("div", { style: st({ width: 132, flex: "0 0 132px", fontSize: 12, color: "#dbe4f0", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }) }, r[0]),
                h("div", { style: st({ flex: 1, height: 24, background: "rgba(255,255,255,0.045)", borderRadius: 6, overflow: "hidden" }) },
                  h("div", { style: st({ height: "100%", width: `${(r[1] / hmax) * 100}%`, background: `linear-gradient(90deg, ${r[2]}, ${soft(r[2])})`, borderRadius: 6, boxShadow: `0 0 14px -2px ${r[2]}` }) })
                ),
                h("div", { style: st({ width: 48, flex: "0 0 48px", fontFamily: "var(--font-body)", fontSize: 13, color: r[2], fontWeight: 600 }) }, fmtPct(r[1]))
              )
            )
          )
        ),
        h("section", { style: st({ flex: "1 1 0", minWidth: 0, background: "linear-gradient(180deg, rgba(17,37,66,0.55), rgba(9,21,40,0.6))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 20 }) },
          h("div", { style: st({ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }) },
            h("h2", { style: st({ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600, margin: 0 }) }, "Duels du 2nd tour")
          ),
          h("div", { style: st({ display: "flex", flexDirection: "column", gap: 15 }) },
            duels.map((d, i) =>
              h("div", { key: i },
                h("div", { style: st({ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, marginBottom: 5 }) },
                  h("div", { style: st({ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0, color: d.ac }) },
                    h("span", { style: st({ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }) }, d.an),
                    h("span", { style: st({ fontFamily: "var(--font-body)", fontWeight: 700, flex: "0 0 auto" }) }, fmtPct(d.av))
                  ),
                  h("div", { style: st({ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0, color: d.bc }) },
                    h("span", { style: st({ fontFamily: "var(--font-body)", fontWeight: 700, flex: "0 0 auto" }) }, fmtPct(d.bv)),
                    h("span", { style: st({ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }) }, d.bn)
                  )
                ),
                h("div", { style: st({ display: "flex", height: 15, borderRadius: 6, overflow: "hidden", background: "rgba(255,255,255,0.05)" }) },
                  h("div", { style: st({ width: `${d.av}%`, background: `linear-gradient(90deg,${d.ac},${soft(d.ac)})` }) }),
                  h("div", { style: st({ width: `${d.bv}%`, background: `linear-gradient(270deg,${d.bc},${soft(d.bc)})` }) })
                ),
                h("div", { style: st({ fontFamily: "var(--font-body)", fontSize: 10, color: "#5f748f", marginTop: 4 }) }, d.sources.map((s) => `${s.institute} ${s.dates}`).join(" · "))
              )
            )
          )
        )
      ),

      // METHODOLOGIE
      h("section", { id: "methodologie", style: st({ marginTop: 34, background: "linear-gradient(180deg, rgba(11,26,48,0.6), rgba(8,18,35,0.6))", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 24 }) },
        h("div", { style: st({ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }) },
          h("h2", { style: st({ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600, margin: 0 }) }, "Méthodologie")
        ),
        h("div", { style: st({ display: "grid", gridTemplateColumns: cfg.methodoCols, gap: 22 }) },
          [
            ["Moyenne et vue de dynamique", "Chaque candidat est affiché à sa moyenne toutes hypothèses confondues (mobile pondérée 40/30/20/10 sur 4 semaines). Les courbes ne s’additionnent pas : ce n’est pas un 1er tour simulé."],
            ["Instituts", "Ifop, Ipsos, Elabe, OpinionWay, Odoxa, Toluna Harris, Cluster17. Marge d’erreur de 2 à 3 points ; un écart de quelques points n’est pas significatif."],
            ["Avertissement & source", "Un sondage n’est pas une prévision. Données extraites de Wikipédia (Liste de sondages présidentielle 2027), CC BY-SA 4.0."],
          ].map(([t, b]) =>
            h("div", { key: t },
              h("div", { style: st({ fontFamily: "var(--font-body)", fontSize: 10.5, letterSpacing: "1px", color: "#d8b24a", marginBottom: 8, textTransform: "uppercase" }) }, t),
              h("p", { style: st({ margin: 0, fontSize: 13.5, color: "#a2b4cd", lineHeight: 1.6 }) }, b)
            )
          )
        )
      ),

      // FOOTER — logo + réseaux Le Millénaire
      h("footer", { style: st({ marginTop: 30, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }) },
        h("a", { href: "https://lemillenaire.org", target: "_blank", rel: "noopener", style: st({ display: "flex", alignItems: "center", gap: 12, color: "#8ba0bd" }) },
          logoMark(36),
          h("span", { style: st({ fontFamily: "var(--font-body)", fontSize: 11, color: "#8ba0bd", letterSpacing: ".3px" }) }, "VIGIE 2027 — Le Millénaire, think tank gaulliste")
        ),
        h("div", { style: st({ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", fontSize: 11.5 }) },
          h("a", { href: "https://lemillenaire.org", target: "_blank", rel: "noopener", style: st({ color: "#b9c7dc" }) }, "Site"),
          h("a", { href: "https://x.com/Le_Millenaire", target: "_blank", rel: "noopener", style: st({ color: "#b9c7dc" }) }, "X"),
          h("a", { href: "https://www.instagram.com/lemillenaire_thinktank/", target: "_blank", rel: "noopener", style: st({ color: "#b9c7dc" }) }, "Instagram"),
          h("a", { href: "https://www.linkedin.com/company/le-mill%C3%A9naire-think-tank/posts/?feedView=all", target: "_blank", rel: "noopener", style: st({ color: "#b9c7dc" }) }, "LinkedIn"),
          h("a", { href: "https://fr.wikipedia.org/wiki/Liste_de_sondages_sur_l%27%C3%A9lection_pr%C3%A9sidentielle_fran%C3%A7aise_de_2027", target: "_blank", rel: "noopener", style: st({ color: "#d8b24a" }) }, "Source · CC BY-SA")
        )
      )
    )
  );
}

function lastRange(range: string | null): string {
  if (!range) return "";
  const [a, b] = range.split(" → ");
  if (!a || !b) return "";
  const A = a.slice(0, 10), B = b.slice(0, 10);
  const [, , da] = A.split("-").map(Number);
  const [yb, mb, db] = B.split("-").map(Number);
  const M = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${da}-${db} ${M[mb - 1]} ${yb}`;
}

// dropdown stylé À L'IDENTIQUE (bordure or + caret or)
function selectEl(value: string, onChange: (v: string) => void, options: [string, string][], padding: string, fontSize: number): ReactNode {
  return h("div", { style: { position: "relative", display: "inline-block" } as React.CSSProperties },
    h("select", {
      value,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value),
      style: { cursor: "pointer", padding, borderRadius: 8, fontSize, fontFamily: "var(--font-body)", color: "#eaf1fb", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(216,178,74,0.3)", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" } as React.CSSProperties,
    }, options.map(([v, l]) => h("option", { key: v, value: v, style: { background: "#0a1a30", color: "#eaf1fb" } as React.CSSProperties }, l))),
    h("span", { style: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#d8b24a", fontSize: 9 } as React.CSSProperties }, "▼")
  );
}

// sparkline (porté, ignore les nulls)
function spark(s: (number | null)[], color: string): ReactNode {
  const vals = s.map((v, i) => [i, v] as [number, number | null]).filter((p) => p[1] != null) as [number, number][];
  if (vals.length < 2) return null;
  const w = 78, ht = 26;
  const ys = vals.map((p) => p[1]);
  const mn = Math.min(...ys), mx = Math.max(...ys), rng = mx - mn || 1;
  const n = s.length;
  const pts = vals.map(([i, v]) => [(i / (n - 1)) * w, ht - 3 - ((v - mn) / rng) * (ht - 6)]);
  const d = "M" + pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L ");
  const last = pts[pts.length - 1];
  return h("svg", { width: w, height: ht, style: { display: "block" } as React.CSSProperties },
    h("path", { d, fill: "none", stroke: color, strokeWidth: 1.6, strokeLinejoin: "round", strokeLinecap: "round" }),
    h("circle", { cx: last[0], cy: last[1], r: 2.2, fill: color })
  );
}

// graphe SVG porté À L'IDENTIQUE ; les nulls (candidat daté) arrêtent la courbe.
function makeChart(
  cands: Cand[],
  dates: string[],
  device: Device,
  active: CandidateId | null,
  hoverIdx: number | null,
  setActive: (id: CandidateId | null) => void,
  setHoverIdx: (i: number | null) => void,
  source: string,
): ReactNode {
  const accent = "#d8b24a";
  const mobile = device === "mobile";
  const n = dates.length;
  // Graphe agrandi (pleine largeur, le feed est passé dessous). Pastilles de bout
  // de courbe compactes pour que l'ensemble respire (anti-collision verticale plus
  // bas). R plus petit ⇒ moins de padR ⇒ courbes plus larges.
  const W = 980, H = mobile ? 480 : 600, padL = 34, R = mobile ? 12 : 16, padR = mobile ? 104 : 140, padT = 28, padB = 44;
  const plotW = W - padL - padR, plotH = H - padT - padB, ymax = 40;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const y = (v: number) => padT + (1 - v / ymax) * plotH;

  const defPts = (s: (number | null)[]) =>
    s.map((v, i) => (v == null ? null : { x: x(i), y: y(v), i, v })).filter((p): p is { x: number; y: number; i: number; v: number } => p !== null);
  const toPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 3) return "M" + pts.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" L ");
    let d = "M" + pts[0].x.toFixed(1) + "," + pts[0].y.toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += " C " + c1x.toFixed(1) + "," + c1y.toFixed(1) + " " + c2x.toFixed(1) + "," + c2y.toFixed(1) + " " + p2.x.toFixed(1) + "," + p2.y.toFixed(1);
    }
    return d;
  };

  const defs = h("defs", null,
    h("filter", { id: "vglow", x: "-20%", y: "-20%", width: "140%", height: "140%" },
      h("feGaussianBlur", { stdDeviation: 3.2, result: "b" }),
      h("feMerge", null, h("feMergeNode", { in: "b" }), h("feMergeNode", { in: "SourceGraphic" }))
    ),
    h("clipPath", { id: "pinclip" }, h("circle", { cx: 0, cy: 0, r: R })),
    cands.map((c) => h("linearGradient", { key: "g" + c.id, id: "area_" + c.id, x1: 0, y1: 0, x2: 0, y2: 1 },
      h("stop", { offset: "0%", stopColor: c.color, stopOpacity: 0.32 }),
      h("stop", { offset: "100%", stopColor: c.color, stopOpacity: 0 })
    ))
  );

  const grid = [0, 10, 20, 30, 40].map((gv) => h("g", { key: "gr" + gv },
    h("line", { x1: padL, x2: W - padR, y1: y(gv), y2: y(gv), stroke: "rgba(255,255,255,0.06)", strokeWidth: 1, strokeDasharray: gv === 0 ? "0" : "2 4" }),
    h("text", { x: padL + 2, y: y(gv) - 5, fill: "#4f6486", fontSize: 10, fontFamily: "var(--font-body)" }, gv + "%")
  ));

  // Axe X allégé : avec l'historique depuis 2025 (~27 points) on n'affiche qu'un
  // libellé sur k pour éviter le chevauchement (le survol garde le détail).
  const labelEvery = Math.max(1, Math.ceil(n / 13));
  const xlabels = dates.map((d, i) =>
    i % labelEvery === 0 || i === n - 1 || hoverIdx === i
      ? h("text", { key: "x" + i, x: x(i), y: H - padB + 22, textAnchor: "middle", fill: hoverIdx === i ? accent : "#5f748f", fontSize: 10, fontFamily: "var(--font-body)", fontWeight: hoverIdx === i ? 600 : 400 }, d)
      : null,
  );

  const areaCand = cands.find((c) => c.id === (active ?? "lepen")) ?? cands.find((c) => c.id === "lepen");
  const areas = areaCand ? (() => {
    const pts = defPts(areaCand.s);
    if (pts.length < 2) return null;
    const d = toPath(pts) + " L " + pts[pts.length - 1].x.toFixed(1) + "," + y(0).toFixed(1) + " L " + pts[0].x.toFixed(1) + "," + y(0).toFixed(1) + " Z";
    return h("path", { d, fill: "url(#area_" + areaCand.id + ")" });
  })() : null;

  const guide = hoverIdx != null ? h("line", { x1: x(hoverIdx), x2: x(hoverIdx), y1: padT, y2: H - padB, stroke: accent, strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.5 }) : null;

  const lines = cands.map((c) => {
    const dim = active && active !== c.id, isA = active === c.id;
    const pts = defPts(c.s);
    if (pts.length < 2) return null;
    return h("path", { key: c.id, d: toPath(pts), fill: "none", stroke: c.color, strokeWidth: isA ? 3.4 : 2.1, opacity: dim ? 0.09 : 1, strokeDasharray: c.stale ? "5 5" : undefined, strokeLinejoin: "round", strokeLinecap: "round", filter: isA ? "url(#vglow)" : undefined });
  });

  // pastilles de fin : au dernier point réel (daté = plus court), empilées à droite
  const withLast = cands.map((c) => { const p = defPts(c.s); return { c, last: p[p.length - 1] }; }).filter((o) => o.last);
  const items = withLast.map((o) => ({ c: o.c, last: o.last!, y: o.last!.y })).sort((a, b) => a.y - b.y);
  const gap = 2 * R + 8, top = padT + 6, bot = H - padB - 6;
  if (items.length) items[0].y = Math.max(items[0].y, top);
  for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < gap) items[i].y = items[i - 1].y + gap;
  if (items.length && items[items.length - 1].y > bot) {
    items[items.length - 1].y = bot;
    for (let i = items.length - 2; i >= 0; i--) if (items[i + 1].y - items[i].y < gap) items[i].y = items[i + 1].y - gap;
  }
  const chipX = x(n - 1) + 8;
  const endpoints = items.map((it) => {
    const c = it.c, dim = active && active !== c.id, px = chipX + R;
    return h("g", { key: "ep" + c.id, opacity: dim ? 0.12 : c.stale ? 0.55 : 1, style: { cursor: "pointer" }, onClick: () => setActive(active === c.id ? null : c.id) },
      h("path", { d: "M" + it.last.x + "," + it.last.y + " C " + (it.last.x + 8) + "," + it.last.y + " " + (px - 8) + "," + it.y + " " + px + "," + it.y, fill: "none", stroke: c.color, strokeWidth: 1, opacity: 0.5 }),
      h("g", { transform: "translate(" + px + " " + it.y + ")" },
        h("circle", { cx: 0, cy: 0, r: R, fill: c.color }),
        h("text", { x: 0, y: R * 0.28, textAnchor: "middle", fill: "#08152a", fontSize: mobile ? 7.5 : 9, fontWeight: 700, fontFamily: "var(--font-display)" }, c.mono),
        c.photo ? h("image", { href: c.photo, x: -R, y: -R, width: 2 * R, height: 2 * R, clipPath: "url(#pinclip)", preserveAspectRatio: "xMidYMid slice", onError: (e: React.SyntheticEvent<SVGImageElement>) => { (e.target as SVGImageElement).style.display = "none"; } }) : null,
        h("circle", { cx: 0, cy: 0, r: R, fill: "none", stroke: "#081428", strokeWidth: 1.6 })
      ),
      h("text", { x: px + R + 5, y: it.y + 4, fill: c.color, fontSize: mobile ? 11 : 12.5, fontWeight: 700, fontFamily: "var(--font-body)" }, fmtNum(it.last.v) + "%"),
      c.stale ? h("text", { x: px + R + 5, y: it.y + 15, fill: "#5f748f", fontSize: 8, fontFamily: "var(--font-body)" }, "au " + frDay(c.lastPollDate)) : null
    );
  });

  const colDots = hoverIdx != null ? cands.map((c) => {
    const v = c.s[hoverIdx];
    if (v == null) return null;
    const dim = active && active !== c.id;
    return h("circle", { key: "cd" + c.id, cx: x(hoverIdx), cy: y(v), r: 4, fill: c.color, stroke: "#050f1e", strokeWidth: 1.5, opacity: dim ? 0.12 : 1 });
  }) : null;

  const onMove = (e: React.MouseEvent<SVGSVGElement> | { clientX: number; currentTarget: Element }) => {
    const r = (e.currentTarget as Element).getBoundingClientRect();
    const vbx = (((e as { clientX: number }).clientX - r.left) / r.width) * W;
    let idx = Math.round((vbx - padL) / (plotW / (n - 1)));
    idx = Math.max(0, Math.min(n - 1, idx));
    setHoverIdx(idx);
  };

  const svg = h("svg", {
    viewBox: "0 0 " + W + " " + H, width: "100%", style: { display: "block", height: "auto", touchAction: "pan-y" } as React.CSSProperties,
    onMouseMove: onMove, onMouseLeave: () => setHoverIdx(null),
    onTouchStart: (e: React.TouchEvent<SVGSVGElement>) => { if (e.touches[0]) onMove({ clientX: e.touches[0].clientX, currentTarget: e.currentTarget }); },
    onTouchMove: (e: React.TouchEvent<SVGSVGElement>) => { if (e.touches[0]) onMove({ clientX: e.touches[0].clientX, currentTarget: e.currentTarget }); },
  }, defs, grid, areas, xlabels, guide, lines, endpoints, colDots);

  let tooltip: ReactNode = null;
  if (hoverIdx != null) {
    const rows = cands.map((c) => ({ c, v: c.s[hoverIdx] })).filter((r) => r.v != null).sort((a, b) => (b.v as number) - (a.v as number));
    const leftPct = (x(hoverIdx) / W) * 100, flip = leftPct > 52;
    tooltip = h("div", { style: { position: "absolute", top: "14px", left: leftPct + "%", transform: "translateX(" + (flip ? "-106%" : "6%") + ")", background: "rgba(6,16,31,0.97)", border: "1px solid " + accent, borderRadius: "11px", padding: "11px 13px", minWidth: "188px", pointerEvents: "none", zIndex: 5, boxShadow: "0 16px 40px rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" } as React.CSSProperties },
      h("div", { style: { fontFamily: "var(--font-body)", fontSize: "10.5px", letterSpacing: "1.5px", color: accent, marginBottom: "9px", textTransform: "uppercase" } as React.CSSProperties }, (source && source !== "all" ? source : "Moyenne") + " / " + dates[hoverIdx]),
      rows.map((r) => h("div", { key: r.c.id, style: { display: "flex", alignItems: "center", gap: "8px", margin: "4px 0", opacity: active && active !== r.c.id ? 0.32 : 1 } as React.CSSProperties },
        h("span", { style: { width: "9px", height: "9px", borderRadius: "2px", background: r.c.color, flex: "0 0 9px" } as React.CSSProperties }),
        h("span", { style: { fontSize: "12px", color: "#dbe4f0", flex: 1, whiteSpace: "nowrap" } as React.CSSProperties }, r.c.name),
        h("span", { style: { fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600, color: r.c.color } as React.CSSProperties }, fmtPct(r.v as number))
      ))
    );
  }

  return h("div", { style: { position: "relative", marginTop: "8px" } as React.CSSProperties }, svg, tooltip);
}
