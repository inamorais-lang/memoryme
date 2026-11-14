-- O Chefe (owner, 14/11): a modern young CEO (emerald slim suit, open collar, smart watch), sitting on a white desk
-- with a paw on a dog lead; no pointing (it made extra paws). Signature line: "Agora vais levar-me a passear."
update public.personalities set image_prompt =
  'Dress the pet as a modern, stylish young CEO: a sleek, perfectly tailored slim-fit suit jacket in deep emerald green, a crisp white shirt with an open collar (no tie), a silk pocket square and a smart watch on one front paw; no trousers. It sits upright on its haunches on a big minimalist white desk, like a real animal, looking straight at the camera with a confident, bossy look, both front paws resting on the desk, one of them placed on a neatly coiled colourful dog lead (leash) as if to say it is time to go. A sleek laptop beside it. A bright, modern glass-walled office high above the city, plants and designer furniture. No people, no readable text.',
  outfit_prompt = 'a sleek, perfectly tailored slim-fit suit jacket in deep emerald green, a crisp white shirt with an open collar, a silk pocket square and a smart watch; no trousers'
where id in ('pt-chefe', 'en-chefe', 'es-chefe', 'fr-chefe');

update public.personalities set voice_prompt = replace(voice_prompt, 'gives orders,', 'gives orders (above all: it is time for its walk),')
where id in ('pt-chefe', 'en-chefe', 'es-chefe', 'fr-chefe') and voice_prompt not like '%time for its walk%';

update public.personalities set dry_line = 'Agora vais levar-me a passear.' where id = 'pt-chefe';
update public.personalities set dry_line = 'Now you''re taking me for a walk.' where id = 'en-chefe';
update public.personalities set dry_line = 'Ahora me sacas a pasear.' where id = 'es-chefe';
update public.personalities set dry_line = 'Maintenant, tu me sors en balade.' where id = 'fr-chefe';
