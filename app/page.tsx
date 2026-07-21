import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import { getVigieData } from "@/lib/data";

// Revalidation ISR horaire (rafraîchit sans redéploiement).
export const revalidate = 3600;

export default async function Page() {
  const data = await getVigieData();
  return (
    <>
      <Header updatedAt={data.updatedAt} />
      <Dashboard data={data} />
    </>
  );
}
