-- Pose ridícula: the body came out small under a life-size head, and a male dog's belly-up pose showed too much.
update public.scenes set addon_prompt =
  'Change the pose: the pet sits upright on its bottom exactly like a human couch potato, leaning far back, round belly sticking out, '
  || 'both hind legs stretched straight forward with the hind paws pointing up, front paws resting on its belly, with a satisfied, silly look. '
  || 'Its whole body keeps its real adult size and proportions (big chest, long thick legs), filling the seat; the seat is scaled to the animal. '
  || 'The groin stays hidden by a hind leg and the fur.'
where kind = 'comic' and split_part(id, '-', 2) = 'pose';
