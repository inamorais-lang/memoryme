-- The phone ended up in human hands. It lies flat on the table; the pet's own
-- front paws rest next to it.
update public.personalities set image_prompt =
  'Dress the pet in a bright yellow trench coat, a red fedora hat and dark sunglasses. Seat it at a sunny café terrace with colourful chairs and flowers. '
  || 'A smartphone lies flat on the table next to a cup of coffee, and the pet gives it a suspicious side-eye, with its own furry front paws resting on the table beside it.'
where id in ('pt-ciumento', 'en-ciumento');
