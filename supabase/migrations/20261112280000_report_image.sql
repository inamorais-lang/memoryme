-- "Reportar imagem" (App Store: a way to flag objectionable AI-generated content).
-- The owner of a picture marks it; the admin page lists the reported ones.
alter table public.generations add column reported_at timestamptz;

create index generations_reported on public.generations (reported_at desc) where reported_at is not null;

create function public.report_generation(p_generation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.generations
  set reported_at = coalesce(reported_at, now())
  where id = p_generation_id and user_id = auth.uid();
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.report_generation(uuid) from public, anon;
grant execute on function public.report_generation(uuid) to authenticated;
