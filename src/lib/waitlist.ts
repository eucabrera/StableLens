const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email.length === 0 || email.length > 254) return null;
  return EMAIL_RE.test(email) ? email : null;
}

export function normalizeSource(input: unknown): string {
  if (typeof input !== "string") return "unknown";
  const s = input.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return s.slice(0, 32) || "unknown";
}

/** Only show a public count once it is real and not embarrassingly small. */
export const MIN_PUBLIC_COUNT = 50;

export function parseAllowedOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
}
