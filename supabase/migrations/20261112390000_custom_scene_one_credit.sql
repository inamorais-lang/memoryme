-- "Criar o teu modo" (custom scene) now costs 1 credit like any picture (product owner).
create or replace function public.start_generation(
  p_user_id uuid,
  p_personality_id text,
  p_original_path text,
  p_custom_scene text default null,
  p_scene_id text default null,
  p_comic_id text default null,
  p_language text default null
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
  v_scene_id text := p_scene_id;
  v_comic_id text := p_comic_id;
  v_cost int;
begin
  -- Older app versions sent the funny ones as the scene, on top of a mode.
  if v_scene_id is not null and v_comic_id is null
    and exists (select 1 from public.scenes where id = v_scene_id and kind = 'comic') then
    v_comic_id := v_scene_id;
    v_scene_id := null;
  end if;

  if p_personality_id is not null
    and not exists (select 1 from public.personalities where id = p_personality_id and active) then
    raise exception 'unknown_personality' using errcode = 'P0001';
  end if;
  if p_personality_id is null and v_scene_id is null and v_scene is null then
    raise exception 'unknown_personality' using errcode = 'P0001';
  end if;

  if split_part(p_original_path, '/', 1) <> p_user_id::text or p_original_path like '%..%' then
    raise exception 'invalid_path' using errcode = 'P0001';
  end if;

  if v_scene is not null and char_length(v_scene) not between 3 and 80 then
    raise exception 'invalid_scene' using errcode = 'P0001';
  end if;
  if v_scene_id is not null then
    if v_scene is not null
      or not exists (select 1 from public.scenes where id = v_scene_id and active and kind = 'place') then
      raise exception 'unknown_scene' using errcode = 'P0001';
    end if;
  end if;
  if v_comic_id is not null
    and not exists (select 1 from public.scenes where id = v_comic_id and active and kind = 'comic') then
    raise exception 'unknown_scene' using errcode = 'P0001';
  end if;
  if p_language is not null and p_language not in ('pt-PT', 'en', 'es', 'fr') then
    raise exception 'invalid_scene' using errcode = 'P0001';
  end if;
  -- Product owner: every picture costs 1 credit, a custom scene too; the funny extra is free.
  v_cost := 1;

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

  insert into public.generations (user_id, personality_id, original_path, scene_id, custom_scene, comic_id, language, cost)
  values (p_user_id, p_personality_id, p_original_path, v_scene_id, v_scene, v_comic_id, p_language, v_cost)
  returning id into v_id;

  insert into public.credit_ledger (user_id, delta, reason, generation_id)
  values (p_user_id, -v_cost, 'generation', v_id);

  return v_id;
end;
$$;
