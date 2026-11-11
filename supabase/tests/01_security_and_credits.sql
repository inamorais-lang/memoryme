-- Tests for RLS and the credit functions. Run with: supabase/tests/run.sh
-- Every check raises on failure, so the script stops at the first problem.
\set ON_ERROR_STOP 1

create schema test;
create function test.expect_error(sql text, expected text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'FAIL: expected error "%" but statement succeeded: %', expected, sql;
exception when others then
  if sqlerrm not like '%' || expected || '%' then
    raise exception 'FAIL: expected error "%" but got "%" for: %', expected, sqlerrm, sql;
  end if;
end $$;
create function test.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAIL: %', label; end if;
  raise notice 'ok - %', label;
end $$;
grant usage on schema test to anon, authenticated, service_role;
grant execute on all functions in schema test to anon, authenticated, service_role;

-- Two users. The trigger must create a profile with 0 credits for each.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@test');
select test.check((select count(*) = 2 and sum(credits) = 0 from public.profiles), 'new users get a profile with 0 credits');

-- ───────── As the service role (Edge Functions) ─────────
set role service_role;

select test.expect_error(
  $$select public.start_generation('aaaaaaaa-0000-0000-0000-000000000001', 'pt-diva', 'aaaaaaaa-0000-0000-0000-000000000001/p.jpg')$$,
  'insufficient_credits');
select test.check(true, 'no credit -> no generation');

select test.check(public.grant_credits('aaaaaaaa-0000-0000-0000-000000000001', 3) = 3, 'grant 3 credits');

select test.expect_error(
  $$select public.start_generation('aaaaaaaa-0000-0000-0000-000000000001', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/p.jpg')$$,
  'invalid_path');
select test.expect_error(
  $$select public.start_generation('aaaaaaaa-0000-0000-0000-000000000001', 'pt-diva', 'aaaaaaaa-0000-0000-0000-000000000001/../x.jpg')$$,
  'invalid_path');
select test.expect_error(
  $$select public.start_generation('aaaaaaaa-0000-0000-0000-000000000001', 'nope', 'aaaaaaaa-0000-0000-0000-000000000001/p.jpg')$$,
  'unknown_personality');
select test.check(true, 'other users'' photos, path tricks and unknown personalities are rejected');

create temp table g (id uuid);
grant all on g to service_role, authenticated;
insert into g select public.start_generation('aaaaaaaa-0000-0000-0000-000000000001', 'pt-diva', 'aaaaaaaa-0000-0000-0000-000000000001/1.jpg');
select test.check((select credits = 2 from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'starting a generation spends 1 credit');
select test.check((select delta = -1 from public.credit_ledger where generation_id = (select id from g)), 'spend is recorded in the ledger');

insert into g select public.start_generation('aaaaaaaa-0000-0000-0000-000000000001', 'pt-diva', 'aaaaaaaa-0000-0000-0000-000000000001/2.jpg');
select test.expect_error(
  $$select public.start_generation('aaaaaaaa-0000-0000-0000-000000000001', 'pt-diva', 'aaaaaaaa-0000-0000-0000-000000000001/3.jpg')$$,
  'rate_limited');
select test.check((select credits = 1 from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'at most 2 generations in progress; the 3rd costs nothing');

-- Failing refunds exactly once.
select test.check(public.fail_generation((select id from g limit 1), 'ai_error'), 'fail a generation');
select test.check(not public.fail_generation((select id from g limit 1), 'ai_error'), 'failing twice is a no-op');
select test.check((select credits = 2 from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'failed generation is refunded exactly once');

-- Success, then the one free phrase.
create temp table ok (id uuid);
grant all on ok to service_role, authenticated;
insert into ok select id from public.generations where status = 'pending' limit 1;
select test.check(public.finish_generation((select id from ok), 'aaaaaaaa-0000-0000-0000-000000000001/out.png', 'Frase 1'), 'finish generation');
select test.check(not public.finish_generation((select id from ok), 'x', 'y'), 'cannot finish twice');
select test.check(not public.fail_generation((select id from ok), 'late'), 'a finished generation cannot be failed (no free refund)');

select test.expect_error(
  format($$select public.claim_free_phrase('bbbbbbbb-0000-0000-0000-000000000002', %L)$$, (select id from ok)),
  'no_free_phrase');
select test.check(true, 'another user cannot claim my free phrase');
select test.check((select shown_phrases = array['Frase 1'] from public.claim_free_phrase('aaaaaaaa-0000-0000-0000-000000000001', (select id from ok))), 'claim the free phrase');
select test.expect_error(
  format($$select public.claim_free_phrase('aaaaaaaa-0000-0000-0000-000000000001', %L)$$, (select id from ok)),
  'no_free_phrase');
select test.check(true, 'free phrase only once');
select public.set_phrase((select id from ok), 'Frase 2');
select test.check((select phrase = 'Frase 2' and shown_phrases = array['Frase 1', 'Frase 2'] from public.generations where id = (select id from ok)), 'new phrase saved and remembered');

-- Custom scene: costs 2 credits and refunds 2.
select public.grant_credits('bbbbbbbb-0000-0000-0000-000000000002', 3);
create temp table cs (id uuid);
grant all on cs to service_role, authenticated;
insert into cs select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/s.jpg', 'a surfar uma onda gigante');
select test.check((select credits = 1 from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'), 'custom scene costs 2 credits');
select test.check((select delta = -2 from public.credit_ledger where generation_id = (select id from cs)), 'ledger records -2');
select test.expect_error(
  $$select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/t.jpg', 'astronauta na lua')$$,
  'insufficient_credits');
select test.check(true, 'custom scene needs 2 credits (1 is not enough)');
select test.expect_error(
  $$select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/t.jpg', repeat('x', 81))$$,
  'invalid_scene');
select test.check(true, 'custom scene is limited to 80 characters');
select test.check(public.fail_generation((select id from cs), 'scene_rejected'), 'fail the custom scene');
select test.check((select credits = 3 from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'), 'failed custom scene refunds 2 credits');

-- Preset scenes cost 1 credit; unknown scenes or both kinds at once are refused.
insert into cs select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/u.jpg', null, 'pt-sorriso');
select test.check((select credits = 2 from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'), 'preset scene costs 1 credit');
select test.check((select scene_id = 'pt-sorriso' and cost = 1 from public.generations g join cs on cs.id = g.id where g.scene_id is not null), 'preset scene saved');
select test.expect_error(
  $$select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/v.jpg', null, 'nao-existe')$$,
  'unknown_scene');
select test.check(true, 'unknown scene refused');
select test.expect_error(
  $$select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/v.jpg', 'na praia', 'pt-sorriso')$$,
  'unknown_scene');
select test.check(true, 'preset and custom scene cannot be mixed');

-- Stuck generations expire and are refunded.
select public.start_generation('aaaaaaaa-0000-0000-0000-000000000001', 'pt-diva', 'aaaaaaaa-0000-0000-0000-000000000001/4.jpg');
update public.generations set created_at = now() - interval '10 minutes' where status = 'pending';
select test.check(public.expire_stale_generations('aaaaaaaa-0000-0000-0000-000000000001') = 1, 'stuck generation expires');
select test.check((select credits = 2 from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'stuck generation is refunded');

reset role;

-- ───────── As user A (the app) ─────────
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';

select test.check((select count(*) = 1 from public.profiles), 'user sees only their own profile');
select test.check((select count(*) = 0 from public.generations where user_id <> auth.uid()), 'user sees only their own generations');
select test.check((select count(*) = 22 from public.personalities), 'user sees the 22 active moods');

select test.expect_error($$select image_prompt from public.personalities limit 1$$, 'permission denied');
select test.expect_error($$select image_prompt from public.scenes limit 1$$, 'permission denied');
select test.check((select count(*) = 6 from public.scenes where language = 'pt-PT'), 'users can list the scenes (names only)');
select test.check(true, 'AI prompts are hidden from the app');

select test.expect_error($$update public.profiles set credits = 999$$, 'permission denied');
select test.expect_error($$insert into public.credit_ledger (user_id, delta, reason) values (auth.uid(), 100, 'grant')$$, 'permission denied');
select test.expect_error($$select public.grant_credits(auth.uid(), 100)$$, 'permission denied');
select test.expect_error($$select public.start_generation(auth.uid(), 'pt-diva', auth.uid() || '/x.jpg')$$, 'permission denied');
select test.expect_error($$update public.generations set status = 'succeeded'$$, 'permission denied');
select test.expect_error($$insert into public.generations (user_id, personality_id, original_path) values (auth.uid(), 'pt-diva', 'x')$$, 'permission denied');
select test.check(true, 'the app cannot add credits, start generations or change results');

select test.expect_error($$update public.generations set free_phrase_used = false$$, 'permission denied');
select test.expect_error($$update public.generations set phrase = 'hacked', status = 'pending'$$, 'permission denied');
select test.expect_error($$delete from public.generations$$, 'permission denied');
select test.expect_error($$update public.personalities set active = false$$, 'permission denied');
select test.check(true, 'user cannot reset the free phrase, edit results, delete rows or edit personalities');
update public.generations set balloon_position = 'bottom' where id = (select id from ok);
update public.generations set custom_phrase = 'A minha frase' where id = (select id from ok);
select test.check((select custom_phrase = 'A minha frase' from public.generations where id = (select id from ok)), 'user can write their own line');
select test.expect_error(format($$update public.generations set custom_phrase = %L where id = %L$$, repeat('x', 46), (select id from ok)), 'check constraint');
select test.check(true, 'own line is limited to 45 characters');
update public.generations set balloon_x = 0.3, balloon_y = 0.6 where id = (select id from ok);
select test.check((select abs(balloon_x - 0.3) < 0.001 from public.generations where id = (select id from ok)), 'user can drag the balloon');
select test.expect_error(format($$update public.generations set balloon_x = 2 where id = %L$$, (select id from ok)), 'check constraint');
select test.check(true, 'balloon stays inside the image');
select test.check((select balloon_position = 'bottom' from public.generations where id = (select id from ok)), 'user can move the balloon');

insert into storage.objects (bucket_id, name) values ('originals', 'aaaaaaaa-0000-0000-0000-000000000001/new.jpg');
select test.check(true, 'user can upload into their own folder');
select test.expect_error($$insert into storage.objects (bucket_id, name) values ('originals', 'bbbbbbbb-0000-0000-0000-000000000002/evil.jpg')$$, 'row-level security');
select test.expect_error($$insert into storage.objects (bucket_id, name) values ('generated', 'aaaaaaaa-0000-0000-0000-000000000001/fake.png')$$, 'row-level security');
select test.check(true, 'user cannot upload into other folders or fake AI results');

-- ───────── As user B ─────────
set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
select test.check((select count(*) = 0 from public.generations where user_id <> auth.uid()), 'user B cannot see user A''s generations');
update public.generations set balloon_position = 'top';
update public.generations set custom_phrase = 'hacked';
reset role;
select test.check((select balloon_position = 'bottom' from public.generations where id = (select id from ok)), 'user B cannot change user A''s generation');
select test.check((select custom_phrase = 'A minha frase' from public.generations where id = (select id from ok)), 'user B cannot change user A''s own line');

-- ───────── Anonymous ─────────
set role anon;
select test.check((select count(*) = 22 from public.personalities), 'personality list is public');
select test.check((select count(*) = 11 from public.personalities where markets @> array['PT']), 'PT market: 11 moods');
select test.check((select count(*) = 11 from public.personalities where markets @> array['US']), 'US market: 11 moods');
select test.check((select count(*) = 11 from public.personalities where markets @> array['GB']), 'UK market: 11 moods');
select test.check((select count(*) = 0 from public.personalities where id = 'en-campaign-rally'), 'no political personality is offered');
select test.check((select count(*) = 0 from public.personalities where id in ('pt-tia-cascais', 'en-karen')), 'human archetypes are retired');
select test.expect_error($$select voice_prompt from public.personalities limit 1$$, 'permission denied');
select test.check(true, 'anonymous users cannot read the AI prompts');
select test.expect_error($$select * from public.profiles$$, 'permission denied');
select test.check(true, 'anonymous users see no profiles');
reset role;

