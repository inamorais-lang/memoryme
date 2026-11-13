-- Owner: the most shared modes are the most successful. The app counts "Partilhar" and "Guardar" per picture.
alter table public.generations
  add column if not exists share_count int not null default 0,
  add column if not exists save_count int not null default 0;

create function public.count_share(p_generation_id uuid, p_kind text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.generations
  set share_count = share_count + case when p_kind = 'share' then 1 else 0 end,
      save_count = save_count + case when p_kind = 'save' then 1 else 0 end
  where id = p_generation_id and user_id = auth.uid() and status = 'succeeded';
$$;
revoke all on function public.count_share(uuid, text) from public, anon;
grant execute on function public.count_share(uuid, text) to authenticated;
