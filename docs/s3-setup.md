# S3 · Dashboard MVP — pasos para Eu

El código del dashboard está en la rama `claude/inspiring-mayer-dxvm1q`. Funciona en local sin
configurar nada más (si la caché de Supabase está vacía, lee los datos en directo de DefiLlama y
CoinGecko). Para que en producción use la caché refrescada cada 5 minutos faltan estos pasos.

## 1. Supabase: ejecutar la migración
SQL Editor → ejecuta `supabase/migrations/0004_market_data.sql`. Añade columnas a `stablecoins`
y crea la tabla `market_history` (lectura pública, escritura solo desde el servidor).

## 2. Netlify: variables de entorno
Site configuration → Environment variables:
- `CRON_SECRET` — un valor largo y aleatorio (por ejemplo, el resultado de `openssl rand -hex 32`).
  Márcalo como secreto. Debe estar disponible en **Functions** y en **Runtime**.
- `COINGECKO_API_KEY` — opcional. Clave "Demo" gratuita de https://www.coingecko.com/en/api.
  Sin ella funciona con la API pública, que tiene menos cuota y a veces devuelve 429 (si pasa,
  el dashboard sigue funcionando y solo se queda sin volumen actualizado en ese ciclo).

## 3. Desplegar
Fusiona el PR a `main`. Netlify detecta la función `netlify/functions/sync-markets.mts` y la ejecuta
cada 5 minutos **solo en el despliegue de producción** (no en las vistas previas de los PR).

## Cómo comprobar que funciona
1. Netlify → Logs → Functions → `sync-markets`: cada 5 min aparece `sync-markets: 200 {"ok":true,"coins":…}`.
2. Supabase → Table editor → `stablecoins` tiene ~200 filas y `market_history` ~400.
3. https://stablelens.netlify.app/dashboard (con sesión iniciada) muestra "Updated N min ago" en vez de "Live data".
4. Prueba manual del cron (sustituye el secreto):
   ```bash
   curl -X POST -H "Authorization: Bearer TU_CRON_SECRET" https://stablelens.netlify.app/api/cron/sync-markets
   ```

## Notas de producto
- Fuentes: DefiLlama (supply, cadenas, tipo de respaldo, histórico) y CoinGecko (volumen 24h, precio).
- Se listan las stablecoins con market cap > $1M. El market cap se valora al precio de mercado
  (igual que el histórico de DefiLlama), así que una stablecoin que pierde el peg no cuenta a $1.
- "Off peg" solo cuenta stablecoins en USD con market cap > $10M (umbrales ±0.1%, ±0.5%, ±1%).
- La dominancia se muestra como barras ordenadas en lugar de donut: se comparan mejor las cuotas.
