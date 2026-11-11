-- First test: no mountain of presents.
update public.scenes set image_prompt =
  'Christmas morning: the pet wears festive red and green pyjamas and sits in front of a huge pile of wrapped presents stacked higher than the pet, '
  || 'filling half of the picture, with torn wrapping paper and ribbons all over the floor and a Christmas tree behind, morning sunlight, bright and joyful.'
where id in ('pt-manha-natal', 'en-manha-natal');
