-- Two steps (scene + mode): the scene gives the place; the mode gives only its outfit, signature prop and attitude.
-- The full image_prompt also names the mode's own place, which won over the scene (the Boss stayed in his office).
alter table public.personalities
  add column outfit_prompt text,
  add column outfit_prompt_male text;

update public.personalities set outfit_prompt = case split_part(id, '-', 2)
  when 'critico' then 'a black beret, a colourful silk scarf and small round glasses, holding a small notebook, judging everything like a strict food critic'
  when 'vilao' then 'a bright purple cape with a high collar and a monocle, with a scheming cartoon-villain look'
  when 'preguicoso' then 'sunny yellow silk pajamas and a sleep mask pushed up on its forehead, looking sleepy and unbothered'
  when 'caotico' then 'a rainbow party hat, a loose bow tie and funny star-shaped sunglasses, looking mischievous'
  when 'diva' then 'a pearl necklace, a hot-pink faux-fur stole and heart-shaped sunglasses, posing like a star'
  when 'ciumento' then 'a bright yellow trench coat, a red fedora hat and dark sunglasses, giving a suspicious side-eye'
  when 'senhor' then 'a smart tweed jacket with a silk bow tie and a pocket square, looking dignified'
  when 'vinho' then 'an elegant glass of red wine standing next to it (the pet does not hold it), with a relaxed, connoisseur look'
  when 'domingo' then 'a soft pastel blanket over its back and a big chunky TV remote control under one front paw, looking lazy'
  when 'chefe' then 'a sharp navy business suit with a bright red tie and a gold wristwatch on one front paw, looking like the boss'
  when 'ferias' then 'small round sunglasses, with a colourful non-alcoholic tropical drink with a paper umbrella next to it, in full holiday mode'
  when 'esfomeado' then 'a white napkin tied around its neck and a red bow tie, staring hungrily at the nearest food'
  when 'dramatico' then 'a chic red winter hat with a pom-pom, a mustard-yellow wool coat and a striped scarf, looking deeply dramatic'
  when 'magnata' then 'a plush burgundy velvet robe and gold-rimmed sunglasses, looking rich and smug'
  when 'drag' then 'a huge voluminous glittery wig in a bold colour clearly different from its fur (hot pink, electric purple or platinum silver), a sparkling sequin gown and a big feathered fan, keeping its natural face with no make-up, posing fabulously'
end;

update public.personalities set outfit_prompt_male =
  'a pearl necklace, an electric-blue faux-fur stole and blue heart-shaped sunglasses, posing like a star'
where split_part(id, '-', 2) = 'diva';
