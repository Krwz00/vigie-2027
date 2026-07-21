import type { Metadata } from "next";
import { Space_Grotesk, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VIGIE 2027 — Agrégateur de sondages · Le Millénaire",
  description:
    "Tous les sondages de l'élection présidentielle française de 2027, agrégés et lissés. Un observatoire indépendant du think tank Le Millénaire.",
  authors: [{ name: "Le Millénaire" }],
  openGraph: {
    title: "VIGIE 2027 — Agrégateur de sondages",
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
      className={`${spaceGrotesk.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
