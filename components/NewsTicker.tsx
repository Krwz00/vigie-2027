"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  isNew: boolean;
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

/** Fil d'actualité RSS (instituts & médias) — filtré sondages, dédupliqué. */
export default function NewsTicker() {
  const [items, setItems] = useState<NewsItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/feed")
      .then((r) => r.json())
      .then((d) => alive && setItems(d.items ?? []))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, []);

  if (items === null) {
    return (
      <div className="panel p-5">
        <div className="eyebrow mb-3">Actualité · flux RSS</div>
        <div className="mono text-[11px] text-ink-faint">Chargement du fil…</div>
      </div>
    );
  }
  if (items.length === 0) return null;

  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="eyebrow">Actualité · flux RSS</div>
        <span className="eyebrow">{items.length}</span>
      </div>
      <ul className="space-y-2.5">
        {items.slice(0, 6).map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mono mt-0.5 w-11 shrink-0 text-[10px] text-ink-faint">
              {fmt(it.publishedAt)}
            </span>
            <a
              href={it.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex-1 text-[12px] leading-snug text-ink-soft hover:text-ink"
            >
              {it.isNew && (
                <span
                  className="mono mr-1.5 rounded-full px-1 py-0.5 text-[8px] font-semibold text-[#04101f]"
                  style={{ background: "#d8b24a" }}
                >
                  NEW
                </span>
              )}
              <span className="underline-offset-2 group-hover:underline">{it.title}</span>
              <span className="mono ml-1 text-[10px] text-ink-faint">· {it.source}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
