-- Domingo came out dark (TV glow) and the remote was often missing.
-- Daylight living room, and a big remote that is clearly visible by the paw.
update public.personalities set image_prompt =
  'Place the pet sprawled on a big, colourful, cosy sofa on a lazy Sunday morning, in a bright living room full of daylight from a big window. '
  || 'A large, chunky TV remote control lies right under its front paw, clearly visible. '
  || 'A soft pastel blanket half on top of the pet, a bowl of popcorn and colourful cushions around. Cheerful and sunny, never dark.'
where id in ('pt-domingo', 'en-domingo');
