import type { ReactNode } from "react";

export function StatCard({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      <span className="font-mono text-2xl font-medium tracking-tight sm:text-[28px]">{value}</span>
      {detail && <span className="text-sm text-muted">{detail}</span>}
    </div>
  );
}

/** Signed % change; the sign is always shown, color only reinforces it. */
export function Delta({ value, children }: { value: number | null; children: ReactNode }) {
  if (value === null) return <span className="font-mono text-muted">—</span>;
  const tone = value > 0 ? "text-good" : value < 0 ? "text-accent-text" : "text-muted";
  return <span className={`font-mono ${tone}`}>{children}</span>;
}
