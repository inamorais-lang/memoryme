-- Review with the product owner: less repetition between modes and scenes.
-- Férias: pool float (the beach scene keeps the sun lounger).
update public.personalities set tagline = 'Boia, cocktail e zero responsabilidades.' where id = 'pt-ferias';
update public.personalities set tagline = 'Pool float, cocktail, zero responsibilities.' where id = 'en-ferias';
update public.personalities set image_prompt =
  'Change the pose: the pet lounges on a big colourful inflatable pool float shaped like a flamingo, drifting on a turquoise swimming pool in bright summer sun, '
  || 'wearing small round sunglasses, with a colourful non-alcoholic tropical drink with a paper umbrella floating next to it. Palm trees and a vivid blue sky behind.'
where id in ('pt-ferias', 'en-ferias');

-- Ciumento: on the sofa, side-eye to an open laptop (no more café table).
update public.personalities set image_prompt =
  'Dress the pet in a bright yellow trench coat, a red fedora hat and dark sunglasses. Place it on a colourful sofa in a bright living room, '
  || 'next to an open laptop on the cushion, giving the laptop a suspicious side-eye, with its own furry front paws on the cushion.'
where id in ('pt-ciumento', 'en-ciumento');

-- Crítico: tasting kibble in a kitchen (no more restaurant table).
update public.personalities set image_prompt =
  'Dress the pet in a black beret, a colourful silk scarf and small round glasses. Place it in a bright, colourful kitchen, judging a bowl of dry kibble '
  || 'on the floor in front of it like a strict food critic, with a small notebook and a pencil next to the bowl. No readable text.'
where id in ('pt-critico', 'en-critico');

-- Pose ridícula: only "sitting like a person" (belly-up is now the beach scene). Pose first, or the model ignores it.
update public.scenes set image_prompt =
  'Change the pose: the pet sits upright on its bottom on a colourful sofa like a person after a big dinner, back against the cushions, '
  || 'hind legs stretched out in front and front paws resting on its round belly, with a satisfied look.'
where id in ('pt-pose', 'en-pose');
