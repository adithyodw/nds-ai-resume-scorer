/* GET /api/candidates — full candidate list.
   DELETE /api/candidates — bulk delete { ids: string[] } */
import { NextResponse } from "next/server";
import { listCandidates, removeCandidates } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const candidates = await listCandidates();
  return NextResponse.json({ candidates });
}

export async function DELETE(req: Request) {
  let body: { ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string" && id) : [];
  if (!ids.length) {
    return NextResponse.json({ error: "Provide a non-empty ids array." }, { status: 400 });
  }
  const removed = await removeCandidates(ids);
  return NextResponse.json({ ok: true, removed });
}
