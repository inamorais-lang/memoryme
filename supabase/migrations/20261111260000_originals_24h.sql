-- Privacy (GDPR): original photos are deleted within 24 hours.
-- The generate pipeline removes each original as soon as it is done; an hourly
-- job calls the cleanup-originals Edge Function for anything left behind.

-- Paths of originals older than 23 hours (hourly job → never older than 24 h).
create function public.stale_originals(p_limit int default 100)
returns setof text
language sql
security definer
set search_path = ''
as $$
  select name from storage.objects
  where bucket_id = 'originals' and created_at < now() - interval '23 hours'
  order by created_at
  limit greatest(1, least(p_limit, 1000));
$$;
revoke all on function public.stale_originals(int) from public, anon, authenticated;
grant execute on function public.stale_originals(int) to service_role;

-- Hourly job (only where pg_cron / pg_net exist: the hosted project, not the local test database).
-- The function needs no key: it can only delete originals older than 23 hours.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron')
     and exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_cron;
    create extension if not exists pg_net;
    perform cron.schedule(
      'cleanup-originals',
      '17 * * * *',
      $job$
      select net.http_post(
        url := 'https://zuwfxzgbxhdpnmkyjdad.supabase.co/functions/v1/cleanup-originals',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
      );
      $job$
    );
  end if;
end;
$$;
