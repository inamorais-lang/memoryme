-- Waiting screen: real progress. The pipeline moves a picture through these steps; the app shows them.
alter table public.generations
  add column stage text not null default 'checking' check (stage in ('checking', 'painting', 'writing'));
