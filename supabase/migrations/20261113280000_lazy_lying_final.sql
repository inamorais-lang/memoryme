-- Preguiçoso: the owner's final choice — lying lazily on the bed in the foreground, yellow pajamas, pink mask, window behind.
update public.personalities set image_prompt =
  'Change the pose: the pet lies lazily stretched out on a big bed in the foreground, head resting on a pillow, big and close to the camera. It clearly wears sunny yellow silk pajamas, buttoned over its chest and front legs, and a soft pastel-pink sleep mask with cute embroidered closed eyelashes pushed up on its forehead so both eyes stay uncovered. Colourful pillows around it, a breakfast tray beside it, a sky-blue bedroom with a sunny window and light curtains right behind it.'
where id in ('pt-preguicoso', 'en-preguicoso', 'es-preguicoso', 'fr-preguicoso');
