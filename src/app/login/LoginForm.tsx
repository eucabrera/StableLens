"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    params.get("error") ? "error" : "idle",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const next = params.get("next") ?? "/dashboard";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return <p className="rounded-md bg-good-soft px-4 py-3 text-sm text-good">Check your inbox for a sign-in link.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium">Email</label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-85 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send magic link"}
      </button>
      {status === "error" && <p className="text-sm text-accent-text">Couldn&apos;t sign you in. Try again.</p>}
    </form>
  );
}
