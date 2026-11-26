import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/app/AppShell";
import { createClient } from "@/lib/supabase/server";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      user={
        <Suspense fallback={<span className="h-4 w-24 animate-pulse rounded bg-surface-2" />}>
          <UserMenu />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}

async function UserMenu() {
  // The session check must run per request, never during prerendering.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  return (
    <div className="flex items-center gap-3">
      <span className="hidden font-mono text-xs text-muted sm:inline">{user.email}</span>
      <form action="/auth/signout" method="post">
        <button className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:border-line-strong hover:text-fg">
          Sign out
        </button>
      </form>
    </div>
  );
}
