import type { Config } from "tailwindcss";

/**
 * Design tokens VIGIE 2027 — Le Millénaire.
 * Palette navy + or, jamais de fond noir pur.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // Bascule automatique : < 760 mobile · < 1180 tablette · sinon web
        tab: "760px",
        web: "1180px",
      },
      colors: {
        bg: {
          top: "#050f1e",
          bottom: "#061426",
        },
        gold: {
          DEFAULT: "#d8b24a",
          hover: "#ecd08a",
        },
        ink: {
          DEFAULT: "#eaf1fb", // texte principal
          soft: "#a2b4cd", // secondaire
          label: "#8ba0bd", // labels
          faint: "#5f748f", // labels faibles
        },
        tri: {
          blue: "#2f5fd0",
          white: "#eef3fa",
          red: "#e5484d",
        },
        panelBorder: "rgba(216,178,74,.15)",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        body: ["var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        panel: "18px",
      },
      backgroundImage: {
        panel:
          "linear-gradient(180deg, rgba(17,37,66,.85), rgba(9,21,40,.9))",
      },
    },
  },
  plugins: [],
};

export default config;
