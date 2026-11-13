-- Snowboard: the bright, mixed-colour outfit the owner liked (golden test image).
update public.scenes
set image_prompt = 'The pet rides a colourful snowboard down a snowy mountain slope, dressed in a full, very bright snowboard outfit: a puffy colour-block snowboard jacket in vivid neon pink, turquoise, orange and lime, zipped up over its chest and back; a long striped scarf with fringes; a knitted striped beanie with a big pompom; colourful ski goggles pushed up on its head. Snow spraying behind, sunny deep-blue sky and white peaks.'
where id in ('pt-snowboard', 'en-snowboard', 'es-snowboard', 'fr-snowboard');
