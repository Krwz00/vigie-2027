"use client";

import { useState } from "react";
import type { Candidate } from "@/lib/types";

/** Avatar rond : photo si disponible, sinon monogramme sur fond couleur candidat. */
export default function Avatar({
  candidate,
  size = 40,
}: {
  candidate: Candidate;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = candidate.photo && !failed;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: candidate.color,
        boxShadow: `0 0 0 1px rgba(6,20,38,.9), 0 0 0 2px ${candidate.color}55`,
      }}
      aria-hidden="true"
    >
      <span
        className="mono font-semibold text-[#04101f]"
        style={{ fontSize: size * 0.34 }}
      >
        {candidate.mono}
      </span>
      {showPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={candidate.photo}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
