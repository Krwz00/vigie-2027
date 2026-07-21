"use client";

import { useEffect, useState } from "react";

/**
 * Badge passif « N nouveau(x) sondage(s) » à côté du badge LIVE.
 * Interroge /api/check-updates au montage (ce qui déclenche aussi la
 * vérification serveur), et se réinitialise quand le fil des sondages a été vu
 * (événement window « vigie:seen »).
 */
export default function HeaderAlert() {
  const [unseen, setUnseen] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/check-updates")
      .then((r) => r.json())
      .then((d) => alive && setUnseen(d.unseen ?? 0))
      .catch(() => {});
    const onSeen = () => setUnseen(0);
    window.addEventListener("vigie:seen", onSeen);
    return () => {
      alive = false;
      window.removeEventListener("vigie:seen", onSeen);
    };
  }, []);

  if (unseen <= 0) return null;

  return (
    <a
      href="#sondages"
      className="chip mono tap"
      style={{ borderColor: "rgba(216,178,74,.5)", background: "rgba(216,178,74,.1)" }}
      aria-label={`${unseen} nouveau(x) sondage(s) depuis votre dernière visite`}
    >
      <span
        className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-[#04101f]"
        style={{ background: "#d8b24a" }}
      >
        {unseen}
      </span>
      <span className="text-ink">nouveau{unseen > 1 ? "x" : ""}</span>
    </a>
  );
}
