-- First test: the cat just sat normally. Describe the human-like slouch precisely.
update public.scenes set image_prompt =
  'Change the pose: the pet slouches on a colourful sofa exactly like a human couch potato, leaning far back with its whole back against the backrest, '
  || 'round belly sticking out, both hind legs stretched straight forward with the hind paws pointing up, front paws resting on its belly, with a satisfied, silly look.'
where id in ('pt-pose', 'en-pose');
