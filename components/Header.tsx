import Logo from "./Logo";
import HeaderAlert from "./HeaderAlert";

const NAV = [
  { label: "Baromètre", href: "#barometre" },
  { label: "Candidats", href: "#candidats" },
  { label: "Hypothèses", href: "#hypotheses" },
  { label: "Sondages", href: "#sondages" },
  { label: "Méthodologie", href: "#methodologie" },
];

function formatLive(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Header({ updatedAt }: { updatedAt: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 backdrop-blur-md">
      <div
        className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-3 tab:px-6"
        style={{ background: "rgba(5,15,30,.72)" }}
      >
        <Logo />

        {/* Nav masquée en mobile */}
        <nav className="hidden tab:flex items-center gap-1" aria-label="Navigation principale">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-white/5 hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <HeaderAlert />
          <div
            className="chip mono !cursor-default"
            style={{ borderColor: "rgba(229,72,77,.4)" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tri-red opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-tri-red" />
            </span>
            <span className="text-ink">LIVE</span>
            <span className="text-ink-faint">· {formatLive(updatedAt)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
