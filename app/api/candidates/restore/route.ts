import { NextResponse } from "next/server";
import { restoreIfEmpty } from "@/lib/store";
import type { Candidate } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { candidates?: Candidate[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const incoming = Array.isArray(body.candidates) ? body.candidates : [];
  if (!incoming.length) {
    return NextResponse.json({ error: "Provide a non-empty candidates array." }, { status: 400 });
  }

  const restored = await restoreIfEmpty(incoming);
  return NextResponse.json({
    ok: true,
    count: restored.length,
    restored: restored.length,
  });
}
