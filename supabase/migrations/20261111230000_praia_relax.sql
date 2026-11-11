-- Product owner: beach day = relax time on a sun lounger.
update public.scenes set image_prompt =
  'Relax time at the beach: the pet lies stretched out on a colourful striped sun lounger, wearing sunglasses, sunbathing with a blissful, totally relaxed look, '
  || 'under a bright beach umbrella, golden sand, turquoise sea and blue sky behind.'
where id in ('pt-praia', 'en-praia');
