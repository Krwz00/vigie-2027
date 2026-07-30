import type { Metadata } from "next";
import Settings from "@/components/Settings";
import { loadSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Parametres (beta) · VIGIE 2027" };
export const revalidate = 3600;

export default async function Page() {
  const data = await loadSettings();
  return <Settings data={data} />;
}
