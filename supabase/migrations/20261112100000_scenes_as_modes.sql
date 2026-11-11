-- Scenes become choices next to the modes (Natal, beach, snowboard, custom),
-- and the 6 funny ones become an optional extra on top of any choice, at no extra cost.
--   kind = 'place': chosen instead of a mode; has its own phrase tone (voice_prompt).
--   kind = 'comic': optional extra; addon_prompt is added to the picture's style.

alter table public.scenes
  add column kind text not null default 'place' check (kind in ('place', 'comic')),
  add column voice_prompt text,
  add column addon_prompt text;
grant select (kind) on public.scenes to anon, authenticated;

update public.scenes set kind = 'comic' where exaggerated;

-- Funny extras: same effect as before, without their own background, so they fit any scene.
update public.scenes set addon_prompt = case split_part(id, '-', 2)
  when 'sorriso' then 'Funny extra: the pet holds a big novelty joke-shop denture in its mouth: plastic pink gums and a row of oversized, flat, bright white human teeth, an obviously fake cheesy grin.'
  when 'olhos' then 'Funny extra: the pet stares straight into the camera with huge, wide-open, startled eyes, comically surprised.'
  when 'oculos' then 'Funny extra: the pet wears oversized glasses on its nose (big round grandpa glasses or colourful retro sunglasses) and looks very serious.'
  when 'cabelo' then 'Funny extra: the pet wears a funny, perfectly styled wig (a glossy bob with a straight fringe, or big bouncy curls).'
  when 'narigudo' then 'Funny extra: fisheye lens, close-up taken a few centimetres from the nose: the wet nose is enormous in the centre of the frame, the eyes and head look small behind it, the scene still visible around it.'
  when 'pose' then 'Change the pose: the pet sits upright on its bottom exactly like a human couch potato, leaning far back, round belly sticking out, both hind legs stretched straight forward with the hind paws pointing up, front paws resting on its belly, with a satisfied, silly look.'
end
where kind = 'comic';

-- Phrase tone for each place scene (the line is still written in the person's language).
update public.scenes set voice_prompt = case
  when id like '%-natal-compras' then 'A pet after Christmas shopping: convinced every bag is a present for it, judges how much the human spent, prefers the boxes to the gifts.'
  when id like '%-consoada' then 'A pet at the festive Christmas dinner: only cares about the food on the table, begs with great dignity, plots to steal from the plates.'
  when id like '%-embrulhar' then 'A pet "helping" to wrap presents: ended up wrapped itself, tangled in ribbon, sure it is the best present of all, sabotaging the wrapping on purpose.'
  when id like '%-manha-natal' then 'A pet on the morning the presents are opened: sure every present is for it, more excited by the paper and the boxes than by the gifts.'
  when id like '%-rena' then 'A pet forced to be one of Santa''s reindeer: outraged by the antlers, complains about unpaid overtime, negotiates its salary in treats.'
  when id like '%-mercado-natal' then 'A pet at a Christmas market: only interested in the food stalls, unimpressed by the lights and the crowd, wants the sausage, not the decorations.'
  when id like '%-natal' then 'A pet at Christmas at home: sees the tree as a climbing frame and the ornaments as its toys, judges the festive jumper, plots to knock it all down.'
  when id like '%-praia' then 'A pet on a beach day: smug sunbather, refuses to leave the sun lounger, hates sand in its fur, treats the human as the beach waiter.'
  when id like '%-snowboard' then 'A pet snowboarding: thinks it is a pro athlete after one run, shows off, dramatic about cold paws, wants a warm blanket and treats.'
end
where kind = 'place';

alter table public.scenes
  add constraint place_has_voice check (kind <> 'place' or voice_prompt is not null),
  add constraint comic_has_addon check (kind <> 'comic' or addon_prompt is not null);

-- A picture now starts from a mode, a place scene or a custom scene; the funny extra is optional.
alter table public.generations
  alter column personality_id drop not null,
  add column comic_id text references public.scenes (id),
  add column language text check (language is null or language in ('pt-PT', 'en', 'es', 'fr')),
  add constraint has_base check (personality_id is not null or scene_id is not null or custom_scene is not null);

drop function public.start_generation(uuid, text, text, text, text);

create function public.start_generation(
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
  -- The funny extra is free: 1 credit, or 2 with a custom scene.
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

  insert into public.generations (user_id, personality_id, original_path, scene_id, custom_scene, comic_id, language, cost)
  values (p_user_id, p_personality_id, p_original_path, v_scene_id, v_scene, v_comic_id, p_language, v_cost)
  returning id into v_id;

  insert into public.credit_ledger (user_id, delta, reason, generation_id)
  values (p_user_id, -v_cost, 'generation', v_id);

  return v_id;
end;
$$;

revoke all on function public.start_generation(uuid, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.start_generation(uuid, text, text, text, text, text, text) to service_role;
