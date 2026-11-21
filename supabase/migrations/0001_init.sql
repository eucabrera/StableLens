create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text,
  created_at timestamptz default now()
);

create table stablecoins (
  id text primary key,
  symbol text not null,
  name text not null,
  peg_target numeric default 1,
  price numeric,
  market_cap numeric,
  volume_24h numeric,
  updated_at timestamptz default now()
);

create table peg_snapshots (
  id bigserial primary key,
  stablecoin_id text references stablecoins(id),
  price numeric not null,
  deviation_pct numeric not null,
  captured_at timestamptz default now()
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stablecoin_id text references stablecoins(id),
  threshold_pct numeric not null check (threshold_pct in (0.1, 0.5, 1)),
  active boolean default true,
  created_at timestamptz default now()
);

create table directory_entries (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text,
  cadenas text[],
  pais text,
  descripcion text,
  links jsonb,
  featured boolean default false
);

create table regulations (
  id uuid primary key default gen_random_uuid(),
  pais text not null,
  regulacion text not null,
  estado text,
  fecha date,
  enlace text
);

create table research_items (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  autor text,
  url text,
  tags text[],
  created_at timestamptz default now()
);

create table invite_codes (
  code text primary key,
  used_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  message text not null,
  created_at timestamptz default now()
);

alter table alerts enable row level security;
create policy "own alerts" on alerts for all using (auth.uid() = user_id);
alter table feedback enable row level security;
create policy "own feedback" on feedback for all using (auth.uid() = user_id);
alter table waitlist enable row level security;
