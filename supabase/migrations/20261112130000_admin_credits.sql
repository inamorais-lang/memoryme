-- Admin gifts: the owner gives credits to an account from a private admin page.
-- Each person has a short account code (Settings) to send to the owner, e.g. PB-7K3Q9X.

create function private.account_code()
returns text
language sql
volatile
set search_path = ''
as $$
  -- No 0/O/1/I: easy to read aloud and type.
  select 'PB-' || string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 6);
$$;

alter table public.profiles add column account_code text;
update public.profiles set account_code = private.account_code() where account_code is null;
alter table public.profiles
  alter column account_code set default private.account_code(),
  alter column account_code set not null,
  add constraint profiles_account_code_key unique (account_code);
-- profiles already lets each user read only their own row.

create table private.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Who gave what to whom (kept even if the admin account goes away).
create table public.admin_grants (
  id bigint generated always as identity primary key,
  admin_id uuid,
  user_id uuid references auth.users (id) on delete set null,
  credits int not null check (credits between 1 and 100),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);
alter table public.admin_grants enable row level security;
revoke all on public.admin_grants from public, anon, authenticated;

create function public.is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.admins where user_id = p_user_id);
$$;

create function public.admin_grant_credits(p_admin_id uuid, p_account_code text, p_amount int, p_note text default null)
returns table (balance int, account_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_code text := upper(btrim(coalesce(p_account_code, '')));
begin
  if not public.is_admin(p_admin_id) then
    raise exception 'not_admin' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount not between 1 and 100 then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;
  if v_code !~ '^PB-' then
    v_code := 'PB-' || v_code;
  end if;
  select id into v_user from public.profiles where profiles.account_code = v_code;
  if v_user is null then
    raise exception 'unknown_account' using errcode = 'P0001';
  end if;

  insert into public.admin_grants (admin_id, user_id, credits, note)
  values (p_admin_id, v_user, p_amount, nullif(btrim(p_note), ''));
  return query select public.grant_credits(v_user, p_amount, 'grant'), v_code;
end;
$$;

revoke all on function public.is_admin(uuid) from public, anon, authenticated;
revoke all on function public.admin_grant_credits(uuid, text, int, text) from public, anon, authenticated;
revoke all on function private.account_code() from public, anon, authenticated;
grant execute on function public.is_admin(uuid) to service_role;
grant execute on function public.admin_grant_credits(uuid, text, int, text) to service_role;
