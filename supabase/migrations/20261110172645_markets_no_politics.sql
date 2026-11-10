-- 1. No politics: the campaign-rally personality is retired (kept inactive
--    so old generations still resolve their personality).
-- 2. UK and US are separate markets. Each personality lists the markets
--    where it is offered; the app asks for its market (PT, US or GB).

update public.personalities set active = false where id = 'en-campaign-rally';

alter table public.personalities
  add column markets text[] not null default '{}'
  check (markets <@ array['PT', 'US', 'GB']);

update public.personalities set markets = array['PT'] where language = 'pt-PT';
update public.personalities set markets = array['US']
  where id in ('en-tech-billionaire', 'en-wall-street', 'en-southern-grandma', 'en-coastal-cowgirl', 'en-wellness-girlie', 'en-campaign-rally');
update public.personalities set markets = array['GB']
  where id in ('en-roadman', 'en-posh-brit', 'en-british-nan');
update public.personalities set markets = array['US', 'GB']
  where language = 'en' and markets = '{}';

create index personalities_markets_idx on public.personalities using gin (markets);

grant select (markets) on public.personalities to anon, authenticated;
