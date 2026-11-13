-- Preguiçoso: with the fuller background some pets lost the pajamas. Say it twice, clearly.
update public.personalities set image_prompt = replace(image_prompt,
  'Behind it, the wall is filled',
  'It clearly wears the yellow pajamas, buttoned over its chest and front legs. Behind it, the wall is filled')
where id in ('pt-preguicoso', 'en-preguicoso', 'es-preguicoso', 'fr-preguicoso')
  and image_prompt not like '%buttoned over its chest%';
