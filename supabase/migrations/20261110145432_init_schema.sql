-- Pet thought translator — initial schema.
--
-- Security model
-- * RLS on every table. Clients can only READ their own rows (plus the
--   public personality list) and change one cosmetic column.
-- * Credits are never written by clients. Every change goes through the
--   functions below, which only the service role (Edge Functions) can run.
-- * A credit is spent atomically BEFORE any AI call and refunded if the
--   generation fails, so nobody can generate without a paid credit.

-- ───────────────────────── Personalities ─────────────────────────
create table public.personalities (
  id text primary key,
  language text not null check (language in ('pt-PT', 'en')),
  name text not null,
  tagline text not null,
  -- Prompts stay on the server: clients cannot select these columns.
  voice_prompt text not null,
  image_prompt text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.personalities enable row level security;

create policy "Anyone can list active personalities"
  on public.personalities for select
  to anon, authenticated
  using (active);

grant select (id, language, name, tagline, sort_order, active)
  on public.personalities to anon, authenticated;

-- ───────────────────────── Profiles (credit balance) ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  credits int not null default 0 check (credits >= 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

grant select on public.profiles to authenticated;

-- Every new auth user gets a profile with 0 credits.
create schema if not exists private;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ───────────────────────── Credit ledger (audit trail) ─────────────────────────
create table public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  delta int not null check (delta <> 0),
  reason text not null check (reason in ('purchase', 'generation', 'refund', 'grant')),
  generation_id uuid,
  -- Phase 3: an App Store transaction can only ever add credits once.
  store_transaction_id text unique,
  created_at timestamptz not null default now()
);

create index credit_ledger_user_created_idx on public.credit_ledger (user_id, created_at desc);

alter table public.credit_ledger enable row level security;

create policy "Users can read their own ledger"
  on public.credit_ledger for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.credit_ledger to authenticated;

-- ───────────────────────── Generations ─────────────────────────
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  personality_id text not null references public.personalities (id),
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  original_path text not null,
  image_path text,
  phrase text,
  shown_phrases text[] not null default '{}',
  free_phrase_used boolean not null default false,
  failure_reason text,
  balloon_position text not null default 'top' check (balloon_position in ('top', 'bottom')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index generations_user_created_idx on public.generations (user_id, created_at desc);
create index generations_pending_idx on public.generations (user_id) where status = 'pending';

alter table public.generations enable row level security;

create policy "Users can read their own generations"
  on public.generations for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- The only thing a user may change is where the balloon sits.
create policy "Users can move the balloon on their own generations"
  on public.generations for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select on public.generations to authenticated;
grant update (balloon_position) on public.generations to authenticated;

-- ───────────────────────── Credit functions (service role only) ─────────────────────────
-- Limits per user. A credit is still required for every generation;
-- these only stop runaway clients and abuse.
create function private.limits()
returns table (per_minute int, per_day int, max_pending int)
language sql
immutable
as $$ select 5, 100, 2 $$;

-- Fails generations stuck in "pending" (e.g. the worker died) and refunds them.
create function public.expire_stale_generations(p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int := 0;
  v_id uuid;
begin
  for v_id in
    select id from public.generations
    where user_id = p_user_id and status = 'pending' and created_at < now() - interval '5 minutes'
    for update skip locked
  loop
    perform public.fail_generation(v_id, 'timeout');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Spends 1 credit and creates the generation, atomically.
create function public.start_generation(
  p_user_id uuid,
  p_personality_id text,
  p_original_path text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_credits int;
  v_last_minute int;
  v_last_day int;
  v_pending int;
  v_limits record;
  v_id uuid;
begin
  if not exists (select 1 from public.personalities where id = p_personality_id and active) then
    raise exception 'unknown_personality' using errcode = 'P0001';
  end if;

  -- Users can only use photos from their own folder.
  if split_part(p_original_path, '/', 1) <> p_user_id::text or p_original_path like '%..%' then
    raise exception 'invalid_path' using errcode = 'P0001';
  end if;

  -- Lock the user's balance: concurrent requests from the same user queue here.
  select credits into v_credits from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'no_profile' using errcode = 'P0001';
  end if;

  perform public.expire_stale_generations(p_user_id);
  select credits into v_credits from public.profiles where id = p_user_id;

  select * into v_limits from private.limits();
  select
    count(*) filter (where created_at > now() - interval '1 minute'),
    count(*),
    count(*) filter (where status = 'pending')
  into v_last_minute, v_last_day, v_pending
  from public.generations
  where user_id = p_user_id and created_at > now() - interval '1 day';

  if v_last_minute >= v_limits.per_minute or v_pending >= v_limits.max_pending then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if v_last_day >= v_limits.per_day then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;
  if v_credits < 1 then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  update public.profiles set credits = credits - 1 where id = p_user_id;

  insert into public.generations (user_id, personality_id, original_path)
  values (p_user_id, p_personality_id, p_original_path)
  returning id into v_id;

  insert into public.credit_ledger (user_id, delta, reason, generation_id)
  values (p_user_id, -1, 'generation', v_id);

  return v_id;
end;
$$;

create function public.finish_generation(p_generation_id uuid, p_image_path text, p_phrase text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.generations
  set status = 'succeeded',
      image_path = p_image_path,
      phrase = p_phrase,
      shown_phrases = array[p_phrase],
      completed_at = now()
  where id = p_generation_id and status = 'pending';
  return found;
end;
$$;

-- Marks a generation as failed and refunds its credit. Safe to call twice.
create function public.fail_generation(p_generation_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  update public.generations
  set status = 'failed', failure_reason = left(p_reason, 200), completed_at = now()
  where id = p_generation_id and status = 'pending'
  returning user_id into v_user_id;

  if v_user_id is null then
    return false;
  end if;

  update public.profiles set credits = credits + 1 where id = v_user_id;
  insert into public.credit_ledger (user_id, delta, reason, generation_id)
  values (v_user_id, 1, 'refund', p_generation_id);
  return true;
end;
$$;

-- Reserves the one free new phrase. Returns what the AI needs, or raises.
create function public.claim_free_phrase(p_user_id uuid, p_generation_id uuid)
returns table (personality_id text, original_path text, shown_phrases text[])
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.generations g
  set free_phrase_used = true
  where g.id = p_generation_id
    and g.user_id = p_user_id
    and g.status = 'succeeded'
    and not g.free_phrase_used
  returning g.personality_id, g.original_path, g.shown_phrases;

  if not found then
    raise exception 'no_free_phrase' using errcode = 'P0001';
  end if;
end;
$$;

create function public.release_free_phrase(p_generation_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.generations set free_phrase_used = false where id = p_generation_id;
$$;

create function public.set_phrase(p_generation_id uuid, p_phrase text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.generations
  set phrase = p_phrase, shown_phrases = shown_phrases || p_phrase
  where id = p_generation_id and status = 'succeeded';
$$;

-- Adds credits (test grants now; App Store purchases in Phase 3).
create function public.grant_credits(
  p_user_id uuid,
  p_amount int,
  p_reason text default 'grant',
  p_store_transaction_id text default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance int;
begin
  if p_amount <= 0 then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;

  insert into public.credit_ledger (user_id, delta, reason, store_transaction_id)
  values (p_user_id, p_amount, p_reason, p_store_transaction_id);

  update public.profiles set credits = credits + p_amount where id = p_user_id
  returning credits into v_balance;
  return v_balance;
end;
$$;

-- Lock every credit function down: callable only by the service role.
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.expire_stale_generations(uuid)',
    'public.start_generation(uuid, text, text)',
    'public.finish_generation(uuid, text, text)',
    'public.fail_generation(uuid, text)',
    'public.claim_free_phrase(uuid, uuid)',
    'public.release_free_phrase(uuid)',
    'public.set_phrase(uuid, text)',
    'public.grant_credits(uuid, int, text, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.limits() from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.limits() to service_role;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ───────────────────────── Storage ─────────────────────────
-- originals: photos the user uploads (into their own folder).
-- generated: images made by the AI (written only by Edge Functions).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('originals', 'originals', false, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp']),
  ('generated', 'generated', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "Users upload originals into their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'originals'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users read their own originals and generated images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('originals', 'generated')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
