-- Scenes, chosen on top of the mood:
--  * preset funny scenes (server-configured, 1 credit), e.g. fake teeth, glasses;
--  * "Cenário à medida": the user describes the scene (max 80 chars), 2 credits.
-- A failure refunds whatever was charged.

create table public.scenes (
  id text primary key,
  language text not null check (language in ('pt-PT', 'en')),
  name text not null,
  -- Prompt stays on the server: clients cannot select it.
  image_prompt text not null,
  -- Comedy scenes may push the expression (wide eyes, open mouth).
  exaggerated boolean not null default false,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.scenes enable row level security;
create policy "Anyone can list active scenes" on public.scenes for select using (active);
revoke all on public.scenes from public, anon, authenticated;
grant select (id, language, name, sort_order, active) on public.scenes to anon, authenticated;

insert into public.scenes (id, language, name, sort_order, exaggerated, image_prompt) values
('pt-sorriso', 'pt-PT', 'Sorriso com dentes', 1, true, 'The pet wears joke-shop fake teeth: a huge, perfectly white, human-like toothy grin filling its mouth, on a bright plain pastel studio background.'),
('pt-olhos', 'pt-PT', 'Olhos arregalados', 2, true, 'The pet stares straight into the camera with huge, wide-open, startled eyes, comically surprised, on a bright plain pastel studio background.'),
('pt-oculos', 'pt-PT', 'Óculos', 3, true, 'The pet wears oversized glasses on its nose (big round grandpa glasses or colourful retro sunglasses) and looks very serious, on a bright plain pastel studio background.'),
('pt-cabelo', 'pt-PT', 'Cabelo novo', 4, true, 'The pet wears a funny, perfectly styled wig (a glossy bob with a straight fringe, or big bouncy curls), on a bright plain pastel studio background.'),
('pt-narigudo', 'pt-PT', 'Narigudo', 5, true, 'Extreme wide-angle close-up: the pet sniffs the lens, its nose looks huge and the head small behind it, on a bright plain pastel background.'),
('pt-pose', 'pt-PT', 'Pose ridícula', 6, true, 'The pet in a ridiculous pose: lying belly-up with its legs in the air, or sitting upright on its bottom like a person, totally relaxed, on a bright colourful sofa.'),
('en-sorriso', 'en', 'Toothy grin', 1, true, 'The pet wears joke-shop fake teeth: a huge, perfectly white, human-like toothy grin filling its mouth, on a bright plain pastel studio background.'),
('en-olhos', 'en', 'Wide eyes', 2, true, 'The pet stares straight into the camera with huge, wide-open, startled eyes, comically surprised, on a bright plain pastel studio background.'),
('en-oculos', 'en', 'Glasses', 3, true, 'The pet wears oversized glasses on its nose (big round grandpa glasses or colourful retro sunglasses) and looks very serious, on a bright plain pastel studio background.'),
('en-cabelo', 'en', 'New hairdo', 4, true, 'The pet wears a funny, perfectly styled wig (a glossy bob with a straight fringe, or big bouncy curls), on a bright plain pastel studio background.'),
('en-narigudo', 'en', 'Big nose', 5, true, 'Extreme wide-angle close-up: the pet sniffs the lens, its nose looks huge and the head small behind it, on a bright plain pastel background.'),
('en-pose', 'en', 'Silly pose', 6, true, 'The pet in a ridiculous pose: lying belly-up with its legs in the air, or sitting upright on its bottom like a person, totally relaxed, on a bright colourful sofa.');

alter table public.generations
  add column scene_id text references public.scenes (id),
  add column custom_scene text check (custom_scene is null or char_length(custom_scene) between 3 and 80),
  add column cost int not null default 1 check (cost in (1, 2)),
  add constraint one_scene check (scene_id is null or custom_scene is null);

drop function public.start_generation(uuid, text, text);

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

-- Refunds exactly what the generation cost. Safe to call twice.
create or replace function public.fail_generation(p_generation_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_cost int;
begin
  update public.generations
  set status = 'failed', failure_reason = left(p_reason, 200), completed_at = now()
  where id = p_generation_id and status = 'pending'
  returning user_id, cost into v_user_id, v_cost;

  if v_user_id is null then
    return false;
  end if;

  update public.profiles set credits = credits + v_cost where id = v_user_id;
  insert into public.credit_ledger (user_id, delta, reason, generation_id)
  values (v_user_id, v_cost, 'refund', p_generation_id);
  return true;
end;
$$;

revoke all on function public.start_generation(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.start_generation(uuid, text, text, text, text) to service_role;
revoke all on function public.fail_generation(uuid, text) from public, anon, authenticated;
grant execute on function public.fail_generation(uuid, text) to service_role;
