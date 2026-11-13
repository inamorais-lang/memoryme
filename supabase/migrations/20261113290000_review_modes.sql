-- Review of all modes with the owner (13/11): no human sitting in trousers, filled backgrounds, fuller outfits.
update public.personalities set image_prompt =
  'Dress the pet in a sharp navy suit jacket with a white shirt collar, a bright red tie and a gold wristwatch on one front paw; no trousers and no shoes. It sits like a real animal on its haunches on a big leather executive chair, front paws resting on a glossy desk, looking very important. A bright corner office with floor-to-ceiling windows and a sunny city skyline behind it.'
where id in ('pt-chefe', 'en-chefe', 'es-chefe', 'fr-chefe');

update public.personalities set image_prompt =
  'Dress the pet in a smart tweed jacket with a silk bow tie and a pocket square; no trousers and no shoes. It sits like a real animal on its haunches in a deep green leather armchair, very dignified, in an elegant bright library with tall wooden bookshelves, a crackling fireplace and warm golden light.'
where id in ('pt-senhor', 'en-senhor', 'es-senhor', 'fr-senhor');

update public.personalities set image_prompt =
  'Dress the pet in a plush burgundy velvet robe with a gold trim and gold-rimmed sunglasses; no trousers. It lies like a real animal, sprawled on its belly or side on a big cushioned lounger on the sunny deck of a white luxury yacht on turquoise water, with a silver tray and a golden bowl beside it.'
where id in ('pt-magnata', 'en-magnata', 'es-magnata', 'fr-magnata');

update public.personalities set image_prompt =
  'Dress the pet as a ceremonial royal guard: a bright red tunic with gold buttons and a white belt, a tall black bearskin hat, and it stands perfectly still and serious at attention. Right behind it, filling the background: a red and black sentry box, tall black and gold iron gates and red-and-blue flags in front of a grand, generic stone palace (not any recognisable real building), on a bright day.'
where id = 'en-guarda';

update public.personalities set image_prompt =
  'Dress the pet as a complete cartoon villain: a bright purple cape with a high collar, a black-and-lime striped waistcoat, a big black bow tie and a monocle on one eye. Seat it on a lime-green velvet throne in a playful cartoon-villain room with purple walls and neon lights, a glass standing on the edge of a side table.'
where id in ('pt-vilao', 'en-vilao', 'es-vilao', 'fr-vilao');

update public.scenes set image_prompt = replace(image_prompt,
  'the pet sits proudly next to a small car',
  'the pet, dressed in a cosy red Christmas jumper knitted with white snowflakes and a Santa hat, sits proudly, big and in the foreground, in front of a small car')
where id in ('pt-natal-compras', 'en-natal-compras', 'es-natal-compras', 'fr-natal-compras')
  and image_prompt not like '%Santa hat%';
