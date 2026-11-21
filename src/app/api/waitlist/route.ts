import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MIN_PUBLIC_COUNT,
  normalizeEmail,
  normalizeSource,
  parseAllowedOrigins,
} from "@/lib/waitlist";

function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowed = parseAllowedOrigins(process.env.WAITLIST_ALLOWED_ORIGINS);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(request: NextRequest, body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders(request) });
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

/** Public waitlist size, hidden until it reaches MIN_PUBLIC_COUNT. */
export async function GET(request: NextRequest) {
  try {
    const { count, error } = await createAdminClient()
      .from("waitlist")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    const shown = count !== null && count >= MIN_PUBLIC_COUNT ? count : null;
    return json(request, { count: shown });
  } catch (err) {
    console.error("waitlist count failed", err);
    return json(request, { count: null });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: "invalid_json" }, 400);
  }

  // Honeypot: bots fill hidden fields. Pretend success.
  if (typeof body.website === "string" && body.website.length > 0) {
    return json(request, { ok: true });
  }

  const email = normalizeEmail(body.email);
  if (!email) return json(request, { error: "invalid_email" }, 400);
  const source = normalizeSource(body.source);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error(err);
    return json(request, { error: "not_configured" }, 503);
  }

  const { error } = await supabase.from("waitlist").insert({ email, source });
  if (error) {
    if (error.code === "23505") return json(request, { ok: true, already: true });
    console.error("waitlist insert failed", error);
    return json(request, { error: "server_error" }, 500);
  }

  await notifyResend(email);
  return json(request, { ok: true }, 201);
}

/** Adds the contact to Resend and sends a welcome email. Failures are logged, not fatal. */
async function notifyResend(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const segmentId = process.env.RESEND_SEGMENT_ID;
  const from = process.env.RESEND_FROM_EMAIL;

  const contact = await resend.contacts.create({
    email,
    unsubscribed: false,
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  });
  if (contact.error) console.error("resend contact failed", contact.error);

  if (!from) return;
  const sent = await resend.emails.send({
    from,
    to: email,
    subject: "You're on the StableLens waitlist",
    text: [
      "Thanks for joining the StableLens beta waitlist.",
      "",
      "We'll email you as soon as private beta access opens. No spam — just that heads-up.",
      "",
      "— The StableLens team",
    ].join("\n"),
  });
  if (sent.error) console.error("resend email failed", sent.error);
}
