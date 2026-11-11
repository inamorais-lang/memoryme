-- Second try: the model kept the original pose. Lead with the pose.
update public.scenes set image_prompt =
  'Change the pose: the pet lies flat on its back with its belly facing the sky and all four paws up in the air, stretched out on a reclined colourful striped sun lounger, '
  || 'wearing sunglasses, sunbathing with a blissful, totally relaxed look. Bright beach umbrella, golden sand, turquoise sea and blue sky behind.'
where id in ('pt-praia', 'en-praia');
