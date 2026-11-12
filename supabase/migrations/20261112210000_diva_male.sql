-- A male Diva (owner chose "Macho") gets the outfit in blue instead of pink (decision of the product owner).
alter table public.personalities add column image_prompt_male text;
update public.personalities set image_prompt_male =
  'Dress the pet in a pearl necklace, an electric-blue faux-fur stole and blue heart-shaped sunglasses. Place it on a bright pink carpet in front of a pastel pink wall with gold confetti falling and colourful balloons.'
where id like '%-diva';
