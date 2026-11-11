-- Phase 3: credit packs sold through the App Store (consumables).
-- verify-purchase (Edge Function) checks Apple's signature, then calls grant_purchase.
-- An App Store transaction can only ever add credits once; refunds remove them.

create table public.credit_packs (
  product_id text primary key,
  credits int not null check (credits > 0),
  sort_order int not null default 0,
  active boolean not null default true
);
alter table public.credit_packs enable row level security;
create policy "Anyone can list active packs" on public.credit_packs for select using (active);
revoke all on public.credit_packs from public, anon, authenticated;
grant select on public.credit_packs to anon, authenticated;

insert into public.credit_packs (product_id, credits, sort_order) values
  ('app.petbubble.credits.1', 1, 1),
  ('app.petbubble.credits.5', 5, 2),
  ('app.petbubble.credits.10', 10, 3),
  ('app.petbubble.credits.30', 30, 4);

-- Kept after account deletion (user_id becomes null): tax records must be retained.
create table public.purchases (
  transaction_id text primary key,
  original_transaction_id text,
  user_id uuid references auth.users (id) on delete set null,
  product_id text not null references public.credit_packs (product_id),
  credits int not null check (credits > 0),
  environment text not null check (environment in ('Production', 'Sandbox', 'Xcode', 'LocalTesting')),
  purchased_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index purchases_user_idx on public.purchases (user_id);
alter table public.purchases enable row level security;
create policy "Users can read their own purchases" on public.purchases for select to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.purchases from public, anon, authenticated;
grant select on public.purchases to authenticated;

alter table public.credit_ledger drop constraint credit_ledger_reason_check,
  add constraint credit_ledger_reason_check check (reason in ('purchase', 'generation', 'refund', 'grant', 'purchase_refund'));

-- Adds the pack's credits once per transaction. Returns how many were added (0 if already granted).
create function public.grant_purchase(
  p_user_id uuid,
  p_transaction_id text,
  p_original_transaction_id text,
  p_product_id text,
  p_environment text,
  p_purchased_at timestamptz
)
returns table (credits_added int, balance int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_credits int;
  v_balance int;
begin
  select credits into v_credits from public.credit_packs where product_id = p_product_id;
  if v_credits is null then
    raise exception 'unknown_product' using errcode = 'P0001';
  end if;
  -- Serialise purchases of the same user.
  perform 1 from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'no_profile' using errcode = 'P0001';
  end if;

  insert into public.purchases (transaction_id, original_transaction_id, user_id, product_id, credits, environment, purchased_at)
  values (p_transaction_id, p_original_transaction_id, p_user_id, p_product_id, v_credits, p_environment, p_purchased_at)
  on conflict (transaction_id) do nothing;

  if not found then
    select credits into v_balance from public.profiles where id = p_user_id;
    return query select 0, v_balance;
    return;
  end if;

  insert into public.credit_ledger (user_id, delta, reason, store_transaction_id)
  values (p_user_id, v_credits, 'purchase', p_transaction_id);
  update public.profiles set credits = credits + v_credits where id = p_user_id returning credits into v_balance;
  return query select v_credits, v_balance;
end;
$$;

-- Apple refunded or revoked a purchase: remove its credits (never below zero). Safe to call twice.
create function public.revoke_purchase(p_transaction_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_credits int;
  v_take int;
begin
  update public.purchases set revoked_at = now()
  where transaction_id = p_transaction_id and revoked_at is null
  returning user_id, credits into v_user_id, v_credits;
  if not found then
    return false;
  end if;
  if v_user_id is null then
    return true; -- account already deleted
  end if;

  select least(credits, v_credits) into v_take from public.profiles where id = v_user_id for update;
  if v_take > 0 then
    update public.profiles set credits = credits - v_take where id = v_user_id;
    insert into public.credit_ledger (user_id, delta, reason)
    values (v_user_id, -v_take, 'purchase_refund');
  end if;
  return true;
end;
$$;

revoke all on function public.grant_purchase(uuid, text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.grant_purchase(uuid, text, text, text, text, timestamptz) to service_role;
revoke all on function public.revoke_purchase(text) from public, anon, authenticated;
grant execute on function public.revoke_purchase(text) to service_role;
