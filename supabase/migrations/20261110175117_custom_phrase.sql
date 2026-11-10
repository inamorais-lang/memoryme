-- Users can write their own line in the balloon (free, no AI call).
-- Max 45 characters, enforced here too.
alter table public.generations
  add column custom_phrase text
  check (custom_phrase is null or char_length(custom_phrase) between 1 and 45);

grant update (custom_phrase) on public.generations to authenticated;

-- The balloon can be dragged anywhere: store its top-left corner as a
-- fraction of the image (0..1). Null = default corner.
alter table public.generations
  add column balloon_x real check (balloon_x is null or balloon_x between 0 and 1),
  add column balloon_y real check (balloon_y is null or balloon_y between 0 and 1);

grant update (balloon_x, balloon_y) on public.generations to authenticated;
