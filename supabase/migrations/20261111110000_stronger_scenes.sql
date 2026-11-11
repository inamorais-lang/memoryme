-- First real test: the fake teeth looked natural and the big nose was not a close-up.
update public.scenes set image_prompt =
  'The pet wears oversized joke-shop dentures: a row of huge, flat, perfectly white human teeth in a wide cheesy grin, clearly fake and very funny, on a bright plain pastel studio background.'
where id in ('pt-sorriso', 'en-sorriso');
update public.scenes set image_prompt =
  'Fisheye lens, extreme close-up taken a few centimetres from the nose: the wet nose is enormous in the centre of the frame, the eyes and head look small behind it, ears out of frame, on a bright plain pastel background.'
where id in ('pt-narigudo', 'en-narigudo');
