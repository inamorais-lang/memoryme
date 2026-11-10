-- Hosted Supabase grants ALL on new public tables/functions/sequences to
-- anon and authenticated by default. That exposed the AI prompts and let a
-- user update any column of their own generations (e.g. reset the free phrase).
-- Start from zero and grant back only what the app needs.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;

-- Read-only access, filtered further by RLS.
grant select (id, language, name, tagline, sort_order, active) on public.personalities to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.credit_ledger to authenticated;
grant select on public.generations to authenticated;
-- The only write: moving the balloon on your own generation.
grant update (balloon_position) on public.generations to authenticated;

-- Future objects created by migrations start locked down too.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;

-- The Edge Functions (service role) keep full access.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
