-- "Sorriso com dentes": the teeth blended into the real mouth and looked odd.
-- Make it an obvious joke-shop prop in front of the mouth, and use the faithful model.
update public.scenes set
  addon_prompt = 'Funny extra: the pet wears an obviously fake joke-shop denture clamped in front of its mouth: a big toy set of shiny pink plastic gums with oversized, perfectly square, bright white teeth, clearly a plastic prop sticking out over its own lips, like a cheap party gag. The pet''s own mouth and teeth stay natural behind it.',
  faithful = true
where kind = 'comic' and id like '%-sorriso';
