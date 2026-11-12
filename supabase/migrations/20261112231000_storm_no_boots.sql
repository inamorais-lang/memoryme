-- Rain boots plus an umbrella in a front paw still drew a third front leg. Keep the umbrella, drop the boots.
update public.scenes set image_prompt =
  'The pet sits by a sunny swimming pool wearing a bright yellow raincoat with the hood up, holding a colourful umbrella open in one front paw while its other front paw rests on the ground, under a perfectly clear blue sky, with an inflatable ring and sunglasses beside it, waiting in vain for the storm.'
where id like '%-trend-storm1';
