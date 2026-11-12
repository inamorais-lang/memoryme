-- "A tempestade que não veio": holding the umbrella while wearing boots made models draw a fifth paw.
-- The umbrella now stands open beside the pet.
update public.scenes set image_prompt =
  'The pet sits by a sunny swimming pool wearing a bright yellow raincoat, with a colourful umbrella standing open on the ground beside it (not held), under a perfectly clear blue sky, an inflatable ring and sunglasses nearby, waiting in vain for the storm.'
where id like '%-trend-storm1';
