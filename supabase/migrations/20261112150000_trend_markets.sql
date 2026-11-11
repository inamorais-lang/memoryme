-- Trending topics differ by country: each scene can be limited to some markets.
-- null = every market (Natal, beach, snowboard, funny touches).
alter table public.scenes add column markets text[]
  check (markets is null or markets <@ array['PT', 'ES', 'FR', 'GB', 'US']);
grant select (markets) on public.scenes to anon, authenticated;
-- The first trend (the storm that never came) is Portuguese news.
update public.scenes set markets = array['PT'] where id like '%-trend-storm1';
