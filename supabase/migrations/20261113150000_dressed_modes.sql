-- Owner's request: every mode dresses the pet in a complete, colourful outfit (people pay for a cute picture).

-- Esfomeado (all languages share the same English prompt)
update public.personalities set image_prompt =
  'Dress the pet as a little chef: a crisp white chef''s hat, a red-and-white striped apron tied over its chest and a red bow tie, a white napkin tucked at its collar. Seat it in a colourful retro diner booth in turquoise and cherry red, with a burger, fries and a milkshake on the table in front of it.'
where id in ('pt-esfomeado', 'en-esfomeado', 'es-esfomeado', 'fr-esfomeado');

-- Vinho
update public.personalities set image_prompt =
  'Dress the pet in a relaxed summer outfit: a light linen shirt in a soft pastel colour with the collar open, a silk neckerchief and a straw hat. Seat it at a sunny terrace table at golden hour overlooking colourful vineyards and hills, with an elegant glass of red wine on the table in front of it (the pet does not hold it), a small plate of cheese, warm and relaxed atmosphere.'
where id in ('pt-vinho', 'en-vinho', 'es-vinho', 'fr-vinho');

-- Férias
update public.personalities set image_prompt =
  'Change the pose: the pet lounges on a big colourful inflatable pool float shaped like a flamingo, drifting on a turquoise swimming pool in bright summer sun. Dress it in a bright Hawaiian shirt with big tropical flowers, a colourful flower garland around its neck, a small straw sun hat and small round sunglasses, with a colourful non-alcoholic tropical drink with a paper umbrella floating next to it. Palm trees and a vivid blue sky behind.'
where id in ('pt-ferias', 'en-ferias', 'es-ferias', 'fr-ferias');

-- Domingo
update public.personalities set image_prompt =
  'Dress the pet in a soft, fluffy pastel onesie with a hood that has cute little bear ears, and cosy striped socks on its paws. Place it sprawled on a big, colourful, cosy sofa on a lazy Sunday morning, in a bright living room full of daylight from a big window. A large, chunky TV remote control lies right under its front paw, clearly visible. A soft pastel blanket half on top of it, a bowl of popcorn and colourful cushions around. Cheerful and sunny, never dark.'
where id in ('pt-domingo', 'en-domingo', 'es-domingo', 'fr-domingo');

-- Praia
update public.scenes set image_prompt =
  'Change the pose: the pet lies flat on its back with its belly facing the sky and all four paws up in the air, stretched out on a reclined colourful striped sun lounger, sunbathing with a blissful, totally relaxed look. It wears a bright Hawaiian shirt with big tropical flowers (open over its chest), a colourful flower garland, a wide straw sun hat and sunglasses. Bright beach umbrella, golden sand, turquoise sea and blue sky behind.'
where id in ('pt-praia', 'en-praia', 'es-praia', 'fr-praia');

-- Natal: Consoada (each language has its own dishes, so only the outfit changes)
update public.scenes set image_prompt = replace(image_prompt,
  'with a white napkin tied around its neck',
  'dressed in a cosy red Christmas jumper knitted with white reindeer and snowflakes and a small Santa hat, with a white napkin tied around its neck')
where id in ('pt-consoada', 'en-consoada', 'es-consoada', 'fr-consoada')
  and image_prompt not like '%Christmas jumper%';

-- Natal: Mercado
update public.scenes set image_prompt = replace(image_prompt,
  'the pet wears a knitted scarf',
  'the pet wears a cosy green Christmas jumper knitted with red and white snowflakes, a long red knitted scarf and a red bobble hat')
where id in ('pt-mercado-natal', 'en-mercado-natal', 'es-mercado-natal', 'fr-mercado-natal')
  and image_prompt not like '%Christmas jumper%';

-- Natal: Rena
update public.scenes set image_prompt = replace(image_prompt,
  'soft reindeer antlers on its head and a little red nose,',
  'soft reindeer antlers on its head and a little red nose, a cosy red knitted jumper with white snowflakes and a red harness with small golden jingle bells,')
where id in ('pt-rena', 'en-rena', 'es-rena', 'fr-rena')
  and image_prompt not like '%jingle bells%';
