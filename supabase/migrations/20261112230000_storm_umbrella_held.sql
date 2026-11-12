-- Back to the umbrella held in a front paw (more fun, decision of the product owner);
-- the global anatomy rule (four legs, boots only on paws on the ground) prevents a fifth paw.
update public.scenes set image_prompt =
  'The pet sits by a sunny swimming pool wearing a bright yellow raincoat and rain boots on the paws resting on the ground, holding a colourful umbrella open in one front paw, under a perfectly clear blue sky, with an inflatable ring and sunglasses beside it, waiting in vain for the storm.'
where id like '%-trend-storm1';
