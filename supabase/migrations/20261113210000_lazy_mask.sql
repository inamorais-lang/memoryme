-- Preguiçoso: on a black cat the sleep mask looked like dark goggles over the eyes. A bright pastel mask, clearly above the eyes.
update public.personalities set image_prompt =
  'Dress the pet in sunny yellow silk pajamas and a soft pastel-pink sleep mask with cute embroidered closed eyelashes, pushed up high on its forehead above its ears line so both eyes stay fully uncovered. Place it in a bed full of colourful pillows in a sky-blue bedroom flooded with morning sun, a breakfast tray beside it.'
where id in ('pt-preguicoso', 'en-preguicoso', 'es-preguicoso', 'fr-preguicoso');
