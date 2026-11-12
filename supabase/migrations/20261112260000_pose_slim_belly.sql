-- Pose ridícula: "round belly sticking out" made dogs look fat or pregnant. Keep the real, slim belly.
update public.scenes set addon_prompt =
  'Change the pose: the pet sits upright on its bottom exactly like a human couch potato, leaning far back, '
  || 'both hind legs stretched straight forward with the hind paws pointing up, front paws resting on its tummy, with a satisfied, silly look. '
  || 'Its whole body keeps its real adult size and proportions (big chest, long thick legs), filling the seat; the seat is scaled to the animal. '
  || 'The belly stays as slim and flat as the real animal''s: never fat, round, swollen or pregnant-looking. '
  || 'The groin stays hidden by a hind leg and the fur.'
where kind = 'comic' and split_part(id, '-', 2) = 'pose';
update public.scenes set image_prompt = replace(image_prompt, 'round belly sticking out, ', '')
where kind = 'comic' and split_part(id, '-', 2) = 'pose';
