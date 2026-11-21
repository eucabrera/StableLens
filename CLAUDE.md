# StableLens — contexto del proyecto

Plataforma web para entender el ecosistema de stablecoins: dashboards, monitor de peg con alertas, directorio de empresas, tracker regulatorio, biblioteca de investigación y herramientas de análisis.

Owner: Eu Cabrera (no desarrollador; Claude escribe el código). Idioma de trabajo: español. Código y commits en inglés.

## Stack
- Next.js (App Router, TypeScript) + Tailwind
- Supabase (Auth, Postgres, RLS)
- Resend (waitlist y emails de alertas)
- Plausible (analítica)
- Chart.js (gráficas)
- Datos: CoinGecko, DefiLlama (yields: Aave, Compound, Curve)
- Stripe (más adelante, S11)
- Hosting: landing en Netlify (stablelens.netlify.app). App: Netlify o Vercel — DECISIÓN ABIERTA.

## Marca
- Colores: bermellón `#BF2A17` (claro `#FDECEA`, oscuro `#8C1A0C`), crema `#FDFAF5`, carbón `#1C1917`, bosque `#1B4332` (claro `#D1FAE5`), arena `#EDE8DE` / `#D6CEBC`, gris `#6B7280`.
- Tipografía: Geist (texto, titulares 700 con tracking apretado), DM Mono (datos y cifras). Sin serif.
- Logo: círculo rojo con "S" en negrita + wordmark "StableLens" en Geist 600.
- Rechazado: acento azul y tipografías serif.
- Referencia visual: `public/index.html`.

## Módulo ancla del MVP
Monitor de peg con alertas: cron cada 5 min, datos de CoinGecko cacheados en Supabase, umbrales ±0.1%, ±0.5%, ±1%.

## Plan (12 sprints)
S1 Validación · S2 Setup técnico · S3 Dashboard MVP · S4 Monitor de peg y alertas · S5 Directorio · S6 Regulación y biblioteca · S7 Herramientas de análisis · S8 Beta privada y QA · S9 GTM Comunidad · S10 GTM Partnerships · S11 Monetización · S12 Escala. Detalle en `docs/sprints.md`.

## Reparto de trabajo
- Claude: código, copy, docs, migraciones, tests.
- Eu: crear cuentas y claves API, registrar dominio, entrevistas, publicar, deploys.
- Nunca inventes claves ni las pongas en el repo; usa `.env.local` (ver `.env.example`) y pide a Eu que las proporcione.

## Reglas
- No marcar tareas como hechas en Notion sin que estén operativas al 100%.
- Verificar datos factuales (p. ej. estado de la GENIUS Act) antes de publicarlos.
- Sustituir el "+240 en la waitlist" ficticio antes del lanzamiento; el formulario de waitlist de la landing está simulado (`handleWL()`).
- Notion: hub `354b097c-82e9-8198-bc32-c9ada1841dc8`, BD tareas `f2dabe79-ea36-41a2-ba45-1d805d499e30`. Sprint select con formato "S01 - ...".

## Assets existentes
- `public/index.html` landing v4 (desplegada).
- `content/lightpaper.html|pdf` lead magnet; `content/infografias.html`.
