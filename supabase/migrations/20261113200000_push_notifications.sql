-- Push notifications (owner-approved): "picture ready", owner news (max 1/week) and a one-time
-- reminder of unused credits 7 days after the last visit. Tokens go through RPCs only.

create table public.push_tokens (
  token text primary key check (token ~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,100}\]$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  language text not null default 'en' check (language in ('pt-PT', 'en', 'es', 'fr')),
  market text check (market in ('PT', 'ES', 'FR', 'GB', 'US')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from public, anon, authenticated;

alter table public.profiles
  add column if not exists last_seen_at timestamptz,
  add column if not exists credits_reminder_at timestamptz;

create table private.push_broadcasts (
  id bigint generated always as identity primary key,
  admin_id uuid not null,
  markets text[] not null,
  texts jsonb not null,
  sent_count int not null default 0,
  sent_at timestamptz not null default now()
);

-- The app registers (or switches off) this device's token for the signed-in user.
create function public.register_push_token(p_token text, p_language text, p_market text, p_enabled boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  insert into public.push_tokens (token, user_id, language, market, enabled, updated_at)
  values (
    p_token, auth.uid(),
    case when p_language in ('pt-PT', 'en', 'es', 'fr') then p_language else 'en' end,
    case when p_market in ('PT', 'ES', 'FR', 'GB', 'US') then p_market else null end,
    coalesce(p_enabled, true), now()
  )
  on conflict (token) do update
    set user_id = excluded.user_id, language = excluded.language, market = excluded.market,
        enabled = excluded.enabled, updated_at = now();
end;
$$;

-- On sign-out the device stops getting this account's notifications.
create function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens where token = p_token and user_id = auth.uid();
$$;

-- Called when the app opens: the credits reminder counts 7 days from here.
create function public.touch_seen()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

revoke all on function public.register_push_token(text, text, text, boolean) from public, anon;
revoke all on function public.unregister_push_token(text) from public, anon;
revoke all on function public.touch_seen() from public, anon;
grant execute on function public.register_push_token(text, text, text, boolean) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;
grant execute on function public.touch_seen() to authenticated;

-- Server only: who gets the credits reminder today (credits left, away 7+ days, not reminded since).
create function public.credit_reminder_targets(p_limit int default 500)
returns table (user_id uuid, token text, language text, credits int)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, t.token, t.language, p.credits
  from public.profiles p
  join public.push_tokens t on t.user_id = p.id and t.enabled
  where p.credits > 0
    and p.last_seen_at is not null
    and p.last_seen_at < now() - interval '7 days'
    and (p.credits_reminder_at is null or p.credits_reminder_at < p.last_seen_at)
  limit greatest(1, least(p_limit, 1000));
$$;

create function public.mark_credit_reminded(p_user_ids uuid[])
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set credits_reminder_at = now() where id = any (p_user_ids);
$$;

-- Owner news: tokens in the chosen countries; refuses if the last one was under 7 days ago.
create function public.admin_push_targets(p_admin_id uuid, p_markets text[])
returns table (token text, language text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(p_admin_id) then raise exception 'not_admin'; end if;
  if exists (select 1 from private.push_broadcasts where sent_at > now() - interval '7 days') then
    raise exception 'too_soon';
  end if;
  return query
    select t.token, t.language from public.push_tokens t
    where t.enabled and t.market = any (p_markets);
end;
$$;

create function public.admin_log_broadcast(p_admin_id uuid, p_markets text[], p_texts jsonb, p_sent int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(p_admin_id) then raise exception 'not_admin'; end if;
  insert into private.push_broadcasts (admin_id, markets, texts, sent_count) values (p_admin_id, p_markets, p_texts, p_sent);
end;
$$;

create function public.admin_list_broadcasts(p_admin_id uuid)
returns table (sent_at timestamptz, markets text[], texts jsonb, sent_count int)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(p_admin_id) then raise exception 'not_admin'; end if;
  return query select b.sent_at, b.markets, b.texts, b.sent_count from private.push_broadcasts b order by b.sent_at desc limit 20;
end;
$$;

-- A token Apple no longer accepts (app removed) is dropped.
create function public.drop_push_tokens(p_tokens text[])
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens where token = any (p_tokens);
$$;

-- Server only: the device tokens of one user (picture ready).
create function public.user_push_tokens(p_user_id uuid)
returns table (token text, language text)
language sql
stable
security definer
set search_path = ''
as $$
  select token, language from public.push_tokens where user_id = p_user_id and enabled;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.credit_reminder_targets(int)', 'public.mark_credit_reminded(uuid[])',
    'public.admin_push_targets(uuid, text[])', 'public.admin_log_broadcast(uuid, text[], jsonb, int)',
    'public.admin_list_broadcasts(uuid)', 'public.drop_push_tokens(text[])', 'public.user_push_tokens(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end;
$$;

-- Daily credits reminder at 17:41 UTC (early evening in PT/ES/FR/GB). Only on the hosted project.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron')
     and exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_cron;
    create extension if not exists pg_net;
    perform cron.schedule(
      'push-reminders',
      '41 17 * * *',
      $job$
      select net.http_post(
        url := 'https://zuwfxzgbxhdpnmkyjdad.supabase.co/functions/v1/push-reminders',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
      );
      $job$
    );
  end if;
end;
$$;
