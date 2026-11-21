import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip the homepage, static assets, the static landing and the public waitlist API.
    "/((?!$|_next/static|_next/image|favicon.ico|index.html|api/waitlist|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)",
  ],
};
