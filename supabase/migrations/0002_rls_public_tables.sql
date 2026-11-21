-- S2: enable RLS on every public table so the anon key can't write to them.
-- Public reference data is readable by anyone; writes happen only with the
-- service role (server-side jobs and admin), which bypasses RLS.

alter table stablecoins enable row level security;
create policy "public read stablecoins" on stablecoins for select using (true);

alter table peg_snapshots enable row level security;
create policy "public read peg_snapshots" on peg_snapshots for select using (true);

alter table directory_entries enable row level security;
create policy "public read directory_entries" on directory_entries for select using (true);

alter table regulations enable row level security;
create policy "public read regulations" on regulations for select using (true);

alter table research_items enable row level security;
create policy "public read research_items" on research_items for select using (true);

-- invite_codes: no policies → only the service role can read/write.
alter table invite_codes enable row level security;

-- waitlist already has RLS with no policies (service role only) since 0001.
