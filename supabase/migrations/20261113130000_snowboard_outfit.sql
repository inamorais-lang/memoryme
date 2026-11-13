-- Snowboard: the pet wears a full snowboard outfit, not only a beanie and goggles (owner's request).
update public.scenes
set image_prompt = 'The pet rides a colourful snowboard down a snowy mountain slope, dressed in a full bright snowboard outfit: a puffy colourful snowboard jacket zipped up over its chest and back, a matching scarf, a bright beanie and ski goggles pushed up on its head. Snow spraying behind, sunny blue sky and white peaks.'
where id in ('pt-snowboard', 'en-snowboard', 'es-snowboard', 'fr-snowboard');
