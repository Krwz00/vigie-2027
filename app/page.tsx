import Shell from "@/components/Shell";
import { getVigieData } from "@/lib/data";
import { loadForecast } from "@/lib/forecast";

// Revalidation ISR horaire (rafraîchit sans redéploiement).
export const revalidate = 3600;

export default async function Page() {
  const [data, forecast] = await Promise.all([getVigieData(), loadForecast()]);
  return <Shell data={data} forecast={forecast} />;
}
