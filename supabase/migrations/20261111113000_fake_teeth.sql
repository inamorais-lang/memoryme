-- The fake teeth still looked like the dog's own grin: make the prop unmistakable.
update public.scenes set image_prompt =
  'The pet holds a big novelty joke-shop denture in its mouth: plastic pink gums and a row of oversized, flat, bright white human teeth, an obviously fake cheesy grin, on a bright plain pastel studio background.'
where id in ('pt-sorriso', 'en-sorriso');
