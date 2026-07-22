import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

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
  title: "VIGIE 2027 · Agrégateur de sondages · Le Millénaire",
  description:
    "Tous les sondages de l'élection présidentielle française de 2027, agrégés et lissés. Un observatoire indépendant du think tank Le Millénaire.",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${bricolage.variable} ${hanken.variable}`}
    >
      <body>
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
