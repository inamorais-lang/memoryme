-- Preguiçoso: jokes strictly about the pet wanting to stay asleep (one came out about waking the human),
-- and a filled background (the fast model sometimes drew a "dream" cloud in the empty wall).
update public.personalities set image_prompt =
  'Dress the pet in sunny yellow silk pajamas and a soft pastel-pink sleep mask with cute embroidered closed eyelashes, pushed up high on its forehead so both eyes stay fully uncovered. Place it in a bed full of colourful pillows in a sky-blue bedroom flooded with morning sun, a breakfast tray beside it. Behind it, the wall is filled with a window with light curtains, a small shelf with a plant and a framed abstract print.'
where id in ('pt-preguicoso', 'en-preguicoso', 'es-preguicoso', 'fr-preguicoso');

update public.personalities set voice_prompt = replace(voice_prompt,
  'Every line is about sleep: let me sleep, five more minutes, do not wake me, it is too early, the human is too loud, the alarm is the enemy, the bed is its whole life. Never about food or the breakfast tray.',
  'The pet is the one in bed and wants to stay asleep: every line begs or orders to be left sleeping (let me sleep, five more minutes, do not wake me, it is too early, speak more quietly, close the curtains, the bed is its whole life). It never wakes anyone up, never talks about waking the human, getting up or going out, and never about food or the breakfast tray.')
where id in ('pt-preguicoso', 'en-preguicoso', 'es-preguicoso', 'fr-preguicoso');
