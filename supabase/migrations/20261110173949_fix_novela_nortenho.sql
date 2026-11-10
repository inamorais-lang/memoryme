-- Gallery feedback: the soap-opera image was too dark and unreadable, and the
-- Nortenho scarf came out checked instead of striped.

update public.personalities set image_prompt =
  'Make it a still from a glamorous prime-time soap opera: the pet in a dramatic close-up, one large glossy tear clearly rolling down its cheek, '
  'warm golden rim light, rich red velvet curtains, a crystal chandelier and a vase of red roses behind. '
  'Bright and well lit so the pet''s face is clearly visible; melodramatic mood.'
where id = 'pt-novela';

update public.personalities set image_prompt =
  'Wrap a knitted football-style scarf around the pet''s neck with bold HORIZONTAL STRIPES in blue and white (stripes only, no checks, no logos or crests). '
  'Place it at a cosy traditional Portuguese tasca table with a francesinha sandwich and a small glass of beer nearby, warm tavern lighting, azulejo tiles on the wall.'
where id = 'pt-nortenho';
