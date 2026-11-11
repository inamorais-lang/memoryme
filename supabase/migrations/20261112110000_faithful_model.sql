-- Scenes that need the faithful (slower) image model: the fast one ignores pose changes.
-- Custom scenes and pets with small facial markings also use it (decided in the pipeline).
alter table public.scenes add column faithful boolean not null default false;
update public.scenes set faithful = true where kind = 'comic' and id like '%-pose';
