/* GET /api/candidates — full candidate list (newest first by createdAt). */
import { NextResponse } from "next/server";
import { listCandidates } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const candidates = await listCandidates();
  return NextResponse.json({ candidates });
}
