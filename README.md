# StableLens

Plataforma para entender el ecosistema de stablecoins. Ver `CLAUDE.md` para el contexto y `docs/sprints.md` para el plan.

## Desarrollo
```bash
npm install
cp .env.example .env.local   # rellena las claves (ver docs/s2-setup.md)
npm run dev                  # http://localhost:3000
```

Scripts: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Estructura
- `src/app` — rutas (App Router): `/login`, `/dashboard` (protegida, dentro del grupo `(app)` con sidebar), `/auth/*`, `/api/waitlist`, `/api/cron/sync-markets`.
- `src/lib/market` — datos de mercado: descarga de DefiLlama/CoinGecko, caché en Supabase, cálculos del dashboard.
- `src/lib/supabase` — clientes de Supabase (navegador, servidor, admin, proxy de sesión).
- `src/proxy.ts` — refresca la sesión y protege `/dashboard`.
- `supabase/migrations` — esquema SQL y RLS.
- `public/index.html` — landing estática, servida en `/` mediante un rewrite en `next.config.ts`.
- `netlify.toml` — configuración de despliegue en Netlify.
- `netlify/functions/sync-markets.mts` — tarea programada (cada 5 min) que refresca la caché de mercado.
