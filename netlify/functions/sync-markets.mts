// Netlify scheduled function: refreshes the market data cache every 5 minutes
// by calling the app's protected sync route. Scheduled functions only run on
// the published (production) deploy.

export default async function syncMarkets(): Promise<Response> {
  const base = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.error("sync-markets: URL or CRON_SECRET missing");
    return new Response("not configured", { status: 500 });
  }

  const res = await fetch(`${base}/api/cron/sync-markets`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  console.log(`sync-markets: ${res.status} ${body}`);
  return new Response(body, { status: res.ok ? 200 : 502 });
}

export const config = { schedule: "*/5 * * * *" };
