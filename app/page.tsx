import Vigie from "@/components/Vigie";
import { getVigieData } from "@/lib/data";

// Revalidation ISR horaire (rafraîchit sans redéploiement).
export const revalidate = 3600;

export default async function Page() {
  const data = await getVigieData();
  return <Vigie data={data} />;
}
