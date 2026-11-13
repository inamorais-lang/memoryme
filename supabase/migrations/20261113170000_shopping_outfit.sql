-- Compras: the pet was not dressed and the line was confusing ("only the bags"). Owner's request.
update public.scenes set image_prompt = replace(image_prompt,
  'Place the pet in a bright, colourful shop on a huge shopping spree,',
  'Dress the pet as a glamorous shopaholic: a bright fuchsia faux-fur jacket, a colourful silk scarf, big sunglasses pushed up on its head and a small shiny handbag on its shoulder. Place it in a bright, colourful shop on a huge shopping spree,')
where id in ('pt-compras', 'en-compras', 'es-compras', 'fr-compras')
  and image_prompt not like '%shopaholic%';

update public.scenes set voice_prompt =
  'A pet on a huge shopping spree with the human''s bank card, acting like a rich shopping queen: taps the card with total confidence, says yes to everything, ignores the price tags, finds the endless receipt normal and leaves the human to deal with the bank account. Clear, simple jokes about the card, the bill and the human paying. Never about bags or boxes.'
where id in ('pt-compras', 'en-compras', 'es-compras', 'fr-compras');
