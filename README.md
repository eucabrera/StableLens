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
- `src/app` — rutas (App Router): `/login`, `/dashboard` (protegida), `/auth/*`, `/api/waitlist`.
- `src/lib/supabase` — clientes de Supabase (navegador, servidor, admin, proxy de sesión).
- `src/proxy.ts` — refresca la sesión y protege `/dashboard`.
- `supabase/migrations` — esquema SQL y RLS.
- `public/index.html` — landing estática, servida en `/` mediante un rewrite en `next.config.ts`.
- `netlify.toml` — configuración de despliegue en Netlify.
