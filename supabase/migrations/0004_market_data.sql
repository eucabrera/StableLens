-- S3: market data cache for the dashboard.
-- Filled every 5 minutes by /api/cron/sync-markets (DefiLlama + CoinGecko).
-- stablecoins.id is the DefiLlama stablecoin id (e.g. '1' = Tether).

alter table stablecoins
  add column if not exists gecko_id text,
  add column if not exists peg_type text,           -- peg currency: USD, EUR, VAR...
  add column if not exists peg_mechanism text,      -- fiat-backed | crypto-backed | algorithmic | other
  add column if not exists chains text[] default '{}',
  add column if not exists chain_circulating jsonb default '{}'::jsonb,  -- { chain: supply in USD }
  add column if not exists market_cap_prev_day numeric,
  add column if not exists price_change_24h_pct numeric,
  add column if not exists listed boolean default true;  -- false once a coin drops out of the feed

create index if not exists stablecoins_listed_market_cap_idx
  on stablecoins (market_cap desc) where listed;

-- Daily total stablecoin market cap (USD) for the historical chart.
create table if not exists market_history (
  date date primary key,
  total_market_cap numeric not null,
  updated_at timestamptz default now()
);

alter table market_history enable row level security;
create policy "public read market_history" on market_history for select using (true);

grant select on market_history to anon, authenticated;
grant select, insert, update, delete on market_history to service_role;
