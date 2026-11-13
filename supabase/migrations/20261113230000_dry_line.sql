-- A mode's signature line, used whenever the dry option is picked (about half the pictures). Owner's request for Preguiçoso.
alter table public.personalities add column if not exists dry_line text check (char_length(dry_line) <= 45);
update public.personalities set dry_line = 'Deixem-me dormir…' where id = 'pt-preguicoso';
update public.personalities set dry_line = 'Let me sleep…' where id = 'en-preguicoso';
update public.personalities set dry_line = 'Dejadme dormir…' where id = 'es-preguicoso';
update public.personalities set dry_line = 'Laissez-moi dormir…' where id = 'fr-preguicoso';
