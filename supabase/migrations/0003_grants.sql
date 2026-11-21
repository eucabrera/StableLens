-- S2: explicit table privileges.
-- Newer Supabase projects no longer grant privileges on new public tables to the
-- API roles by default, so each role gets only what it needs. RLS (0001/0002)
-- still applies on top of these grants for anon and authenticated.

-- Server-side code (service role key): full access. Bypasses RLS.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Public reference data: readable by everyone (RLS policies allow select only).
grant usage on schema public to anon, authenticated;
grant select on stablecoins, peg_snapshots, directory_entries, regulations, research_items
  to anon, authenticated;

-- Signed-in users manage their own rows (RLS limits them to auth.uid() = user_id).
grant select, insert, update, delete on alerts, feedback to authenticated;

-- waitlist and invite_codes: no grants to anon/authenticated (server only).
