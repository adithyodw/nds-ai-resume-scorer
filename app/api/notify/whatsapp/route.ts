/* POST /api/notify/whatsapp — send shortlist+schedule alert to Adit.
   Uses Twilio WhatsApp when TWILIO_* env vars are set; otherwise returns wa.me URL. */

import { NextResponse } from "next/server";
import { getCandidate } from "@/lib/store";
import { buildShortlistScheduleMessage, buildWhatsAppUrl, NOTIFY_PHONE } from "@/lib/whatsapp";

export const runtime = "nodejs";

async function sendViaTwilio(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) return false;

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: from,
      To: `whatsapp:${to}`,
      Body: body,
    }),
  });
  return res.ok;
}

export async function POST(req: Request) {
  let body: { candidateId?: string; origin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { candidateId, origin } = body;
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId is required." }, { status: 400 });
  }

  const candidate = await getCandidate(candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  if (candidate.status !== "shortlisted" || !candidate.scheduledAt) {
    return NextResponse.json(
      { error: "Candidate must be shortlisted and scheduled before notifying." },
      { status: 400 }
    );
  }

  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const message = buildShortlistScheduleMessage(candidate, base);
  const waUrl = buildWhatsAppUrl(NOTIFY_PHONE, message);

  const sent = await sendViaTwilio(`+${NOTIFY_PHONE}`, message);

  return NextResponse.json({
    ok: true,
    sent,
    waUrl,
    phone: `+65 ${NOTIFY_PHONE.slice(2)}`,
  });
}
