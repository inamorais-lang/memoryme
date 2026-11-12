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
select test.check(public.finish_generation((select id from ok), 'aaaaaaaa-0000-0000-0000-000000000001/out.png', 'Frase 1', array[0.3, 0.4, 0.35, 0.3]::real[], array[0.6, 0.7, 0.2, 0.1]::real[], array[0.2, 0.3, 0.6, 0.6]::real[]), 'finish generation');
select test.check((select body = array[0.2, 0.3, 0.6, 0.6]::real[] from public.generations where id = (select id from ok)), 'body box saved');
select test.check((select head = array[0.3, 0.4, 0.35, 0.3]::real[] from public.generations where id = (select id from ok)), 'head box saved');
select test.check((select prop = array[0.6, 0.7, 0.2, 0.1]::real[] from public.generations where id = (select id from ok)), 'prop box saved');
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

-- Custom scene ("Criar o teu modo"): costs 1 credit like any picture and refunds 1.
select public.grant_credits('bbbbbbbb-0000-0000-0000-000000000002', 3);
create temp table cs (id uuid);
grant all on cs to service_role, authenticated;
insert into cs select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/s.jpg', 'a surfar uma onda gigante');
select test.check((select credits = 2 from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'), 'custom scene costs 1 credit');
select test.check((select delta = -1 from public.credit_ledger where generation_id = (select id from cs)), 'ledger records -1');
select test.expect_error(
  $$select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/t.jpg', repeat('x', 81))$$,
  'invalid_scene');
select test.check(true, 'custom scene is limited to 80 characters');
select test.check(public.fail_generation((select id from cs), 'scene_rejected'), 'fail the custom scene');
select test.check((select credits = 3 from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'), 'failed custom scene refunds its credit');

-- Preset scenes cost 1 credit; unknown scenes or both kinds at once are refused.
insert into cs select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/u.jpg', null, 'pt-sorriso');
select test.check((select credits = 2 from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'), 'preset scene costs 1 credit');
select test.check((select comic_id = 'pt-sorriso' and scene_id is null and cost = 1 from public.generations g join cs on cs.id = g.id where g.comic_id is not null), 'older apps: a funny one sent as the scene is saved as the extra');
select test.expect_error(
  $$select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/v.jpg', null, 'nao-existe')$$,
  'unknown_scene');
select test.check(true, 'unknown scene refused');
select test.expect_error(
  $$select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/v.jpg', 'na praia', 'pt-sorriso')$$,
  'unknown_scene');
select test.check(true, 'preset and custom scene cannot be mixed');

-- Scenes instead of a mode, and the free funny extra.
update public.generations set created_at = now() - interval '2 days' where user_id = 'bbbbbbbb-0000-0000-0000-000000000002';
select public.grant_credits('bbbbbbbb-0000-0000-0000-000000000002', 3);
create temp table pl (id uuid);
grant all on pl to service_role, authenticated;
insert into pl select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', null, 'bbbbbbbb-0000-0000-0000-000000000002/w.jpg', null, 'pt-praia', 'pt-oculos');
select test.check((select personality_id is null and scene_id = 'pt-praia' and comic_id = 'pt-oculos' and cost = 1 from public.generations where id = (select id from pl)), 'a place scene without a mode, plus a funny extra, costs 1 credit');
insert into pl select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', null, 'bbbbbbbb-0000-0000-0000-000000000002/x.jpg', 'no espaço', null, 'pt-narigudo', 'fr');
select test.check((select count(*) = 1 from public.generations where custom_scene = 'no espaço' and comic_id = 'pt-narigudo' and language = 'fr' and cost = 1), 'a custom scene without a mode, plus a funny extra, costs 1 credit');
-- 3 + 3 granted (one older pending test picture expired and was refunded), minus 1 and 1.
select test.check((select credits = 4 from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'), 'the funny extra is free');
select test.expect_error(
  $$select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', null, 'bbbbbbbb-0000-0000-0000-000000000002/y.jpg')$$,
  'unknown_personality');
select test.check(true, 'a mode, a scene or a custom scene is required');
select test.expect_error(
  $$select public.start_generation('bbbbbbbb-0000-0000-0000-000000000002', 'pt-diva', 'bbbbbbbb-0000-0000-0000-000000000002/y.jpg', null, null, 'pt-praia')$$,
  'unknown_scene');
select test.check(true, 'only a funny one can be the extra');


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
select test.check((select count(*) = 72 from public.personalities), 'user sees the 72 active moods (18 × PT, EN, ES, FR)');

select test.expect_error($$select image_prompt from public.personalities limit 1$$, 'permission denied');
select test.expect_error($$select image_prompt from public.scenes limit 1$$, 'permission denied');
select test.check((select count(*) = 18 from public.scenes where language = 'pt-PT'), 'users can list the scenes (names only)');
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
select test.check((select count(*) = 72 from public.personalities), 'personality list is public');
select test.check((select count(*) = 18 from public.personalities where markets @> array['PT']), 'PT market: 18 moods');
select test.check((select count(*) = 18 from public.personalities where markets @> array['US']), 'US market: 18 moods');
select test.check((select count(*) = 18 from public.personalities where markets @> array['GB']), 'UK market: 18 moods');
select test.check((select count(*) = 18 from public.personalities where markets @> array['ES']), 'Spain: 18 moods');
select test.check((select count(*) = 18 from public.personalities where markets @> array['FR']), 'France: 18 moods');
select test.check((select count(*) = 0 from public.personalities where id = 'en-campaign-rally'), 'no political personality is offered');
select test.check((select count(*) = 0 from public.personalities where id in ('pt-tia-cascais', 'en-karen')), 'human archetypes are retired');
select test.expect_error($$select voice_prompt from public.personalities limit 1$$, 'permission denied');
select test.check(true, 'anonymous users cannot read the AI prompts');
select test.expect_error($$select * from public.profiles$$, 'permission denied');
select test.check(true, 'anonymous users see no profiles');
reset role;

-- Privacy: originals older than 23 h are listed for deletion; only the server can list them.
insert into storage.objects (bucket_id, name, created_at) values
  ('originals', 'aaaaaaaa-0000-0000-0000-000000000001/old.jpg', now() - interval '25 hours'),
  ('originals', 'aaaaaaaa-0000-0000-0000-000000000001/new.jpg', now() - interval '1 hour'),
  ('generated', 'aaaaaaaa-0000-0000-0000-000000000001/old-result.jpg', now() - interval '25 hours');
set role service_role;
select test.check((select array_agg(p) = array['aaaaaaaa-0000-0000-0000-000000000001/old.jpg'] from public.stale_originals(10) p), 'only originals older than 23 h are listed');
reset role;
set role authenticated;
select test.expect_error($$select public.stale_originals(10)$$, 'permission denied');
select test.check(true, 'users cannot call the clean-up listing');
reset role;

-- Purchases: once per transaction, refunds remove credits (never below zero), records survive account deletion.
set role service_role;
select test.check((select credits_added = 5 from public.grant_purchase('aaaaaaaa-0000-0000-0000-000000000001', 'tx-1', 'tx-1', 'app.petbubble.credits.5', 'Sandbox', now())), 'a 5-pack adds 5 credits');
select test.check((select credits_added = 0 from public.grant_purchase('aaaaaaaa-0000-0000-0000-000000000001', 'tx-1', 'tx-1', 'app.petbubble.credits.5', 'Sandbox', now())), 'the same transaction never adds credits twice');
select test.expect_error($$select * from public.grant_purchase('aaaaaaaa-0000-0000-0000-000000000001', 'tx-2', 'tx-2', 'app.petbubble.free', 'Sandbox', now())$$, 'unknown_product');
select test.check(true, 'unknown products are refused');
create temp table bal (c int);
grant all on bal to service_role;
insert into bal select credits from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select test.check(public.revoke_purchase('tx-1'), 'refund revokes the purchase');
select test.check(not public.revoke_purchase('tx-1'), 'a refund is applied only once');
select test.check((select p.credits = greatest(b.c - 5, 0) from public.profiles p, bal b where p.id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'refund removes the 5 credits');
reset role;
set role authenticated;
select test.expect_error($$select * from public.grant_purchase('aaaaaaaa-0000-0000-0000-000000000001', 'tx-9', 'tx-9', 'app.petbubble.credits.30', 'Sandbox', now())$$, 'permission denied');
select test.check(true, 'users cannot grant themselves purchases');
select test.check((select count(*) = 4 from public.credit_packs where on_sale), 'users can see the 4 packs on sale');
select test.check((select credits = 2 and not on_sale from public.credit_packs where product_id = 'app.petbubble.credits.2'), 'the voucher pack (2 credits) is not on sale');
reset role;
reset role;


-- ───────── Admin gifts ─────────
select test.check((select count(*) = 2 and bool_and(account_code ~ '^PB-[2-9A-HJ-NP-Z]{6}$') from public.profiles), 'every account gets a code like PB-7K3Q9X');
insert into private.admins (user_id) values ('aaaaaaaa-0000-0000-0000-000000000001');
create temp table codes as select id, account_code from public.profiles;
grant select on codes to service_role, authenticated;
create temp table before_gift as select credits from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002';
grant select on before_gift to service_role;
set role service_role;
select test.check(public.is_admin('aaaaaaaa-0000-0000-0000-000000000001') and not public.is_admin('bbbbbbbb-0000-0000-0000-000000000002'), 'only the listed account is admin');
-- The code works in lower case and without "PB-".
select test.check(
  (select balance = (select credits from before_gift) + 3
   from public.admin_grant_credits('aaaaaaaa-0000-0000-0000-000000000001',
     lower(substr((select account_code from codes where id = 'bbbbbbbb-0000-0000-0000-000000000002'), 4)), 3, 'amigo')),
  'the admin gives 3 credits by account code');
select test.check((select count(*) = 1 from public.admin_grants where credits = 3 and note = 'amigo'), 'the gift is logged');
select test.expect_error($$select * from public.admin_grant_credits('bbbbbbbb-0000-0000-0000-000000000002', (select account_code from codes limit 1), 3)$$, 'not_admin');
select test.check(true, 'a non-admin cannot give credits');
select test.expect_error($$select * from public.admin_grant_credits('aaaaaaaa-0000-0000-0000-000000000001', 'PB-ZZZZZZ', 3)$$, 'unknown_account');
select test.check(true, 'an unknown code is refused');
select test.expect_error($$select * from public.admin_grant_credits('aaaaaaaa-0000-0000-0000-000000000001', (select account_code from codes limit 1), 500)$$, 'invalid_amount');
select test.check(true, 'at most 100 credits at a time');
reset role;
set role authenticated;
set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
select test.check((select count(*) = 1 and bool_and(account_code like 'PB-%') from public.profiles), 'each user sees their own account code');
select test.expect_error($$select * from public.admin_grant_credits('aaaaaaaa-0000-0000-0000-000000000001', 'PB-ZZZZZZ', 3)$$, 'permission denied');
select test.check(true, 'users cannot call the admin function');
select test.expect_error($$select * from public.admin_grants$$, 'permission denied');
select test.check(true, 'users cannot read the gift log');
reset role;

-- ───────── Reportar imagem ─────────
create temp table a_gen as select id from public.generations where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' limit 1;
grant select on a_gen to authenticated;
set role authenticated;
set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
select test.expect_error($$select public.report_generation((select id from a_gen))$$, 'not_found');
select test.check(true, 'a user cannot report someone else''s picture');
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
select public.report_generation((select id from a_gen));
select public.report_generation((select id from a_gen));
select test.check((select reported_at is not null from public.generations where id = (select id from a_gen)), 'the owner reports their picture (twice is fine)');
reset role;
set role anon;
select test.expect_error($$select public.report_generation((select id from a_gen))$$, 'permission denied');
select test.check(true, 'anonymous callers cannot report');
reset role;

-- ───────── Frases-modelo (só o servidor) ─────────
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
select test.expect_error($$select * from public.phrase_examples$$, 'permission denied');
select test.check(true, 'users cannot read the phrase examples');
reset role;
