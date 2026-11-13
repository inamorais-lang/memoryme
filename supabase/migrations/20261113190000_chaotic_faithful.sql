-- Caótico on the faithful model: the fast one kept the room tidy and the pet calm (owner compared).
update public.personalities set faithful = true where id in ('pt-caotico', 'en-caotico', 'es-caotico', 'fr-caotico');
