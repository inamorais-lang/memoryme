-- "Sorriso com dentes" becomes a natural smile with the pet's own mouth (no fake teeth),
-- decision of the product owner. Fast model is enough again.
update public.scenes set
  addon_prompt = 'Funny extra: the pet gives the camera a big, natural, happy smile with its own real mouth and teeth: a dog with a wide open-mouth grin and tongue out, a cat with a relaxed, content, slightly open-mouthed smile and its own small cat teeth. No fake teeth, no dentures, no human teeth.',
  faithful = false,
  name = case language when 'pt-PT' then 'Sorriso' when 'en' then 'Big smile' when 'es' then 'Sonrisa' when 'fr' then 'Grand sourire' end
where kind = 'comic' and id like '%-sorriso';
