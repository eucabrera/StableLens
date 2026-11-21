# S2 · Setup técnico — pasos para Eu

Claude ya dejó el código listo (rama `s2-technical-setup`). Para que funcione de verdad faltan estos pasos, que requieren tus cuentas.

## 1. Supabase
1. Crea un proyecto en https://supabase.com (región UE si es posible).
2. SQL Editor → ejecuta en orden `0001_init.sql`, `0002_rls_public_tables.sql` y `0003_grants.sql` (carpeta `supabase/migrations`). Si Supabase avisa de "Row Level Security", elige "Run and enable RLS".
3. Project Settings → API → copia `URL`, `anon key` y `service_role key` a `.env.local`.
4. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (cámbialo por la URL de producción al desplegar).
   - Redirect URLs: añade `http://localhost:3000/auth/callback` y `https://<tu-dominio>/auth/callback`.
5. (Recomendado) Authentication → SMTP: usa Resend como SMTP para que los emails de login salgan desde tu dominio.

## 2. Resend
1. Crea cuenta en https://resend.com y verifica tu dominio (DNS).
2. Crea una API key → `RESEND_API_KEY`.
3. Audience → Segments → crea "Waitlist" → copia el ID → `RESEND_SEGMENT_ID`.
4. Define el remitente → `RESEND_FROM_EMAIL`, p. ej. `StableLens <hola@tudominio.com>`.

## 3. GitHub
- Haz push de la rama y abre un PR. El workflow `.github/workflows/ci.yml` ejecuta lint, typecheck, tests y build en cada PR (no necesita secretos).

## 4. Netlify
La app y la landing viven en el mismo sitio (`stablelens.netlify.app`): `/` sigue mostrando la landing y la app añade `/login`, `/dashboard` y `/api/waitlist`. Así el formulario de la landing llama a `/api/waitlist` sin configurar nada más.

1. En Netlify, abre el sitio actual → Site configuration → Build & deploy → enlázalo al repo de GitHub `eucabrera/StableLens` (rama `main`). Si ahora se despliega arrastrando una carpeta, este paso lo cambia a despliegue automático desde GitHub.
2. Netlify lee `netlify.toml` (build `npm run build`, Node 24) y detecta Next.js solo.
3. Site configuration → Environment variables → añade las de `.env.example`:
   - `NEXT_PUBLIC_SITE_URL` = `https://stablelens.netlify.app` (o tu dominio).
   - Las de Supabase y Resend.
   - `WAITLIST_ALLOWED_ORIGINS` no hace falta mientras landing y app compartan sitio.
4. En Supabase → Authentication → URL Configuration, pon la Site URL de producción y añade `https://stablelens.netlify.app/auth/callback`.
5. Netlify crea previews por cada PR: sirven para probar antes de fusionar a `main`.

## Cómo comprobar que funciona
1. `npm run dev` → abre http://localhost:3000, apúntate a la waitlist → aparece una fila en la tabla `waitlist`, el contacto en Resend y te llega el email.
2. http://localhost:3000/login → recibes el magic link → acabas en `/dashboard` con tu email.
3. El contador de la landing solo aparece cuando hay ≥ 50 inscritos reales.
