"use client";

import { useState } from "react";

// Le vrai logo est chargé depuis public/brand/ s'il existe ; sinon fallback M.
const SOURCES = ["/brand/logo-millenaire.svg", "/brand/logo-millenaire.png"];

/** Pastille logo Le Millénaire (fallback « M ») + wordmark VIGIE 2027. */
export default function Logo() {
  const [srcIdx, setSrcIdx] = useState(0);
  const useFallback = srcIdx >= SOURCES.length;

  return (
    <div className="flex items-center gap-3">
      {useFallback ? (
        <span
          className="display flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-[#04101f]"
          style={{
            background: "linear-gradient(145deg, #ecd08a, #d8b24a)",
            boxShadow:
              "0 0 0 1px rgba(216,178,74,.4), 0 6px 18px rgba(216,178,74,.18)",
          }}
          aria-hidden="true"
        >
          M
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={SOURCES[srcIdx]}
          alt="Le Millénaire"
          className="h-9 w-9 rounded-full object-contain"
          onError={() => setSrcIdx((i) => i + 1)}
        />
      )}
      <div className="leading-none">
        <div className="display text-[17px] font-bold tracking-tight text-ink">
          VIGIE <span className="text-gold">2027</span>
        </div>
        <div className="eyebrow mt-0.5 text-[9px]">Le Millénaire</div>
      </div>
    </div>
  );
}
