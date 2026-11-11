-- Product owner: lying belly-up on the sun lounger.
update public.scenes set image_prompt =
  'Relax time at the beach: the pet lies belly-up on its back on a colourful striped sun lounger, paws relaxed in the air, wearing sunglasses, '
  || 'sunbathing with a blissful, totally relaxed look, under a bright beach umbrella, golden sand, turquoise sea and blue sky behind.'
where id in ('pt-praia', 'en-praia');
