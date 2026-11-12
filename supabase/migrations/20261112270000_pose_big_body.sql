-- The "slim, flat belly" made the whole dog look small. Back to a big, heavy body, with a natural (not swollen) belly.
update public.scenes set addon_prompt =
  'Change the pose: the pet sits upright on its bottom exactly like a human couch potato, leaning far back, '
  || 'both hind legs stretched straight forward with the hind paws pointing up, front paws resting on its tummy, with a satisfied, silly look. '
  || 'Its whole body is big, heavy and broad like the real adult animal (deep chest, long thick legs), filling the whole seat from armrest to armrest; the seat is scaled to the animal. '
  || 'Natural belly, never swollen or pregnant-looking. '
  || 'The groin stays hidden by a hind leg and the fur.'
where kind = 'comic' and split_part(id, '-', 2) = 'pose';
