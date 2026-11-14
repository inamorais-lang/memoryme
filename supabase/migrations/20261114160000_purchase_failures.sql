-- Diagnostics: why verify-purchase refused a transaction (no personal data; only the server writes and reads).
create table if not exists private.purchase_failures (
  id bigint generated always as identity primary key,
  code text not null,
  detail text,
  created_at timestamptz not null default now()
);
create or replace function public.log_purchase_failure(p_code text, p_detail text)
returns void language sql security definer set search_path = '' as $$
  insert into private.purchase_failures (code, detail) values (left(p_code, 60), left(p_detail, 500));
$$;
revoke all on function public.log_purchase_failure(text, text) from public, anon, authenticated;
grant execute on function public.log_purchase_failure(text, text) to service_role;
