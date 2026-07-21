import { NextResponse } from "next/server";
import { markSeen } from "@/lib/updates";

export const dynamic = "force-dynamic";

export async function POST() {
  const unseen = await markSeen();
  return NextResponse.json({ unseen }, { headers: { "Cache-Control": "no-store" } });
}
