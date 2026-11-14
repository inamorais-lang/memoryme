-- O Chefe (owner, 14/11): always one of two signature lines, never an AI joke; tagline is the walk line.
alter table public.personalities add column if not exists dry_always boolean not null default false;
alter table public.personalities drop constraint if exists personalities_dry_line_check;
alter table public.personalities add constraint personalities_dry_line_check check (char_length(dry_line) <= 120);

update public.personalities set dry_always = true where id in ('pt-chefe', 'en-chefe', 'es-chefe', 'fr-chefe');
update public.personalities set dry_line = E'Agora vais levar-me a passear.\nHora do biscoito. Vai buscar.', tagline = 'Agora vais levar-me a passear.' where id = 'pt-chefe';
update public.personalities set dry_line = E'Now you''re taking me for a walk.\nTreat time. Go and get it.', tagline = 'Now you''re taking me for a walk.' where id = 'en-chefe';
update public.personalities set dry_line = E'Ahora me sacas a pasear.\nHora de la galleta. Ve a por ella.', tagline = 'Ahora me sacas a pasear.' where id = 'es-chefe';
update public.personalities set dry_line = E'Maintenant, tu me sors en balade.\nL’heure du biscuit. Va le chercher.', tagline = 'Maintenant, tu me sors en balade.' where id = 'fr-chefe';
