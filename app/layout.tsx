import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import BetaBanner from "@/components/BetaBanner";

// Design Claude Design : Bricolage Grotesque (titres) + Hanken Grotesk (texte
// courant et chiffres tabulaires).
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VIGIE 2027 · Beta interne",
  description: "Version de travail interne, non publique.",
  robots: { index: false, follow: false },
  authors: [{ name: "Le Millénaire" }],
  openGraph: {
    title: "VIGIE 2027 · Agrégateur de sondages",
    description:
      "Tous les sondages de la présidentielle 2027, agrégés. Un sondage n'est pas une prévision.",
    siteName: "Le Millénaire",
    locale: "fr_FR",
    type: "website",
  },
};

async function lastRun(): Promise<string | null> {
  try {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const raw = await readFile(path.join(process.cwd(), "public", "forecast.json"), "utf8");
    return (JSON.parse(raw) as { updatedAt?: string }).updatedAt ?? null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const date = await lastRun();
  return (
    <html
      lang="fr"
      className={`${bricolage.variable} ${hanken.variable}`}
    >
      <body>
        <BetaBanner date={date} />
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
