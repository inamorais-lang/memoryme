-- Preguiçoso: back to the original picture the owner likes (yellow silk pajamas, mask on the forehead, sitting on the bed).
update public.personalities set image_prompt =
  'Dress the pet in sunny yellow silk pajamas with a sleep mask pushed up on its forehead. Place it in a bed full of colourful pillows in a sky-blue bedroom flooded with morning sun, a breakfast tray beside it.'
where id in ('pt-preguicoso', 'en-preguicoso', 'es-preguicoso', 'fr-preguicoso');
