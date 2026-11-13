-- Hora do Vinho (owner): pets do not care for cheese. A beautifully plated charcuterie plate for the pet beside the glass,
-- the cheese stays as the human's; signature line "Queijo e vinho são teus. O resto é meu."
update public.personalities set image_prompt =
  'Dress the pet in a relaxed summer outfit: a light linen shirt in a soft pastel colour with the collar open, a silk neckerchief and a straw hat. Seat it at a sunny terrace table at golden hour overlooking colourful vineyards and hills. On the table: an elegant glass of red wine (the pet does not hold it) with a small plate of cheese beside it, and, right in front of the pet, a beautifully presented charcuterie plate with neatly folded slices of ham, thin curls of cured ham and a few crispy bacon strips, garnished like in a fine restaurant, which the pet eyes lovingly. Warm and relaxed atmosphere.'
where id in ('pt-vinho', 'en-vinho', 'es-vinho', 'fr-vinho');

update public.personalities set voice_prompt = replace(voice_prompt,
  'pretending to be a connoisseur.',
  'pretending to be a connoisseur; the wine and the cheese are for the human, the ham and bacon are its own.')
where id in ('pt-vinho', 'en-vinho', 'es-vinho', 'fr-vinho') and voice_prompt not like '%ham and bacon%';

update public.personalities set dry_line = 'Queijo e vinho são teus. O resto é meu.' where id = 'pt-vinho';
update public.personalities set dry_line = 'Cheese and wine are yours. The rest is mine.' where id = 'en-vinho';
update public.personalities set dry_line = 'Queso y vino, tuyos. Lo demás, mío.' where id = 'es-vinho';
update public.personalities set dry_line = 'Fromage et vin pour toi. Le reste, à moi.' where id = 'fr-vinho';
