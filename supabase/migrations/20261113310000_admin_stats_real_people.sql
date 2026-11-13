-- Statistics count only real people: the automatic test accounts (@memoryme.test) are left out.
create or replace function public.admin_stats(p_admin_id uuid, p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365)));
  v_result jsonb;
begin
  if not public.is_admin(p_admin_id) then raise exception 'not_admin'; end if;
  with g as (
    select * from public.generations where created_at >= v_since and user_id in (select id from auth.users where coalesce(email, '') not like '%@memoryme.test')
  ), days as (
    select d::date as day from generate_series(v_since::date, now()::date, interval '1 day') d
  )
  select jsonb_build_object(
    'days', p_days,
    'totals', jsonb_build_object(
      'accounts', (select count(*) from public.profiles where id in (select id from auth.users where coalesce(email, '') not like '%@memoryme.test')),
      'new_accounts', (select count(*) from public.profiles where created_at >= v_since and id in (select id from auth.users where coalesce(email, '') not like '%@memoryme.test')),
      'creators', (select count(distinct user_id) from g),
      'images', (select count(*) from g where status = 'succeeded'),
      'failed', (select count(*) from g where status = 'failed'),
      'free_phrases', (select count(*) from g where free_phrase_used),
      'own_phrases', (select count(*) from g where custom_phrase is not null),
      'reported', (select count(*) from g where reported_at is not null),
      'avg_seconds', (select round(avg(extract(epoch from completed_at - created_at))) from g where status = 'succeeded' and completed_at is not null),
      'fast', (select count(*) from g where status = 'succeeded' and image_model = 'fast'),
      'faithful', (select count(*) from g where status = 'succeeded' and image_model = 'faithful'),
      'gifted_credits', (select coalesce(sum(credits), 0) from public.admin_grants where created_at >= v_since)
    ),
    'per_day', (
      select jsonb_agg(jsonb_build_object(
        'day', d.day,
        'accounts', (select count(*) from public.profiles p where p.created_at::date = d.day and p.id in (select id from auth.users where coalesce(email, '') not like '%@memoryme.test')),
        'images', (select count(*) from g where g.status = 'succeeded' and g.created_at::date = d.day),
        'failed', (select count(*) from g where g.status = 'failed' and g.created_at::date = d.day),
        'fast', (select count(*) from g where g.status = 'succeeded' and g.image_model = 'fast' and g.created_at::date = d.day),
        'faithful', (select count(*) from g where g.status = 'succeeded' and g.image_model = 'faithful' and g.created_at::date = d.day),
        'purchases', (select count(*) from public.purchases pu where pu.environment = 'Production' and pu.revoked_at is null and pu.purchased_at::date = d.day)
      ) order by d.day desc)
      from days d
    ),
    'modes', (
      select coalesce(jsonb_agg(jsonb_build_object('mode', m.mode, 'count', m.n) order by m.n desc), '[]'::jsonb) from (
        select coalesce(
                 (select name from public.personalities where id = g.personality_id),
                 (select name from public.scenes where id = g.scene_id),
                 case when g.custom_scene is not null then '✏️ Criar o teu modo' end,
                 '?') as mode,
               count(*) as n
        from g where g.status = 'succeeded'
        group by 1 order by 2 desc limit 25
      ) m
    ),
    'languages', (
      select coalesce(jsonb_agg(jsonb_build_object('language', l.lang, 'count', l.n) order by l.n desc), '[]'::jsonb) from (
        select case
                 when g.language = 'en' and g.spelling = 'US' then 'en-US'
                 when g.language = 'en' then 'en-GB'
                 else coalesce(g.language, '?') end as lang,
               count(*) as n
        from g where g.status = 'succeeded' group by 1
      ) l
    ),
    'countries', (
      select coalesce(jsonb_agg(jsonb_build_object('market', c.market, 'count', c.n) order by c.n desc), '[]'::jsonb) from (
        select coalesce(t.market, '?') as market, count(distinct t.user_id) as n
        from public.push_tokens t group by 1
      ) c
    ),
    'failures', (
      select coalesce(jsonb_agg(jsonb_build_object('reason', f.reason, 'count', f.n) order by f.n desc), '[]'::jsonb) from (
        select coalesce(failure_reason, '?') as reason, count(*) as n from g where status = 'failed' group by 1 order by 2 desc limit 10
      ) f
    ),
    'packs', (
      select coalesce(jsonb_agg(jsonb_build_object('product', p.product_id, 'count', p.n, 'credits', p.c) order by p.product_id), '[]'::jsonb) from (
        select product_id, count(*) as n, sum(credits) as c
        from public.purchases
        where environment = 'Production' and revoked_at is null and purchased_at >= v_since
        group by 1
      ) p
    ),
    'sandbox_purchases', (select count(*) from public.purchases where environment <> 'Production' and purchased_at >= v_since)
  ) into v_result;
  return v_result;
end;
$$;

