-- Clean-up after removing "Exagerado": drop its parameter, column and guard trigger.
-- Costs are back to 1 (2 with a custom scene).
drop trigger generations_no_exaggerated on public.generations;
drop function private.no_exaggerated();
drop function public.start_generation(uuid, text, text, text, text, boolean);
alter table public.generations drop column exaggerated,
  drop constraint generations_cost_check,
  add constraint generations_cost_check check (cost in (1, 2));
revoke select (exaggerated) on public.scenes from anon, authenticated;

create function public.start_generation(
  p_user_id uuid,
  p_personality_id text,
  p_original_path text,
  p_custom_scene text default null,
  p_scene_id text default null
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
  v_scene text := nullif(btrim(p_custom_scene), '');
  v_cost int;
begin
  if not exists (select 1 from public.personalities where id = p_personality_id and active) then
    raise exception 'unknown_personality' using errcode = 'P0001';
  end if;

  if split_part(p_original_path, '/', 1) <> p_user_id::text or p_original_path like '%..%' then
    raise exception 'invalid_path' using errcode = 'P0001';
  end if;

  if v_scene is not null and char_length(v_scene) not between 3 and 80 then
    raise exception 'invalid_scene' using errcode = 'P0001';
  end if;
  if p_scene_id is not null then
    if v_scene is not null
      or not exists (select 1 from public.scenes where id = p_scene_id and active) then
      raise exception 'unknown_scene' using errcode = 'P0001';
    end if;
  end if;
  v_cost := case when v_scene is null then 1 else 2 end;

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
  if v_credits < v_cost then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  update public.profiles set credits = credits - v_cost where id = p_user_id;

  insert into public.generations (user_id, personality_id, original_path, scene_id, custom_scene, cost)
  values (p_user_id, p_personality_id, p_original_path, p_scene_id, v_scene, v_cost)
  returning id into v_id;

  insert into public.credit_ledger (user_id, delta, reason, generation_id)
  values (p_user_id, -v_cost, 'generation', v_id);

  return v_id;
end;
$$;

revoke all on function public.start_generation(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.start_generation(uuid, text, text, text, text) to service_role;

