/* ============================================================
   GET    /api/candidates/[id]  — single candidate
   PATCH  /api/candidates/[id]  — update status (shortlist/reject/...)
   DELETE /api/candidates/[id]  — remove from pipeline
   ============================================================ */

import { NextResponse } from "next/server";
import { getCandidate, setStatus, scheduleCandidate, removeCandidate } from "@/lib/store";
import type { CandidateStatus } from "@/lib/types";

export const runtime = "nodejs";

const VALID: CandidateStatus[] = ["new", "review", "shortlisted", "rejected"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = await getCandidate(id);
  if (!candidate) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ candidate });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { status?: string; schedule?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.schedule) {
    const candidate = await scheduleCandidate(id);
    if (!candidate) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ candidate });
  }

  if (!body.status || !VALID.includes(body.status as CandidateStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID.join(", ")}` },
      { status: 400 }
    );
  }
  const candidate = await setStatus(id, body.status as CandidateStatus);
  if (!candidate) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ candidate });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await removeCandidate(id);
  return NextResponse.json({ ok: true });
}
