import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

export default function DashboardPage() {
  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-sand px-6">
        <Logo />
        <form action="/auth/signout" method="post">
          <button className="text-sm text-muted hover:text-carbon">Sign out</button>
        </form>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <CurrentUser />
        </Suspense>
        <p className="text-muted">Market data arrives in Sprint 3.</p>
      </main>
    </>
  );
}

async function CurrentUser() {
  // The session check must run per request, never during prerendering.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  return (
    <p>
      Signed in as <span className="font-mono">{user.email}</span>
    </p>
  );
}
