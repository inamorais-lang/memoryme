-- Where the scene's main prop is (TV remote, glass, cocktail…), as x, y, w, h
-- fractions 0..1. The app keeps the balloon off it too (the face comes first).

alter table public.generations
  add column prop real[] check (
    prop is null or (
      array_length(prop, 1) = 4
      and prop[1] between 0 and 1 and prop[2] between 0 and 1
      and prop[3] between 0 and 1 and prop[4] between 0 and 1
    )
  );

drop function public.finish_generation(uuid, text, text, real[]);

create function public.finish_generation(
  p_generation_id uuid,
  p_image_path text,
  p_phrase text,
  p_head real[] default null,
  p_prop real[] default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.generations
  set status = 'succeeded',
      image_path = p_image_path,
      phrase = p_phrase,
      shown_phrases = array[p_phrase],
      head = p_head,
      prop = p_prop,
      completed_at = now()
  where id = p_generation_id and status = 'pending';
  return found;
end;
$$;

revoke all on function public.finish_generation(uuid, text, text, real[], real[]) from public, anon, authenticated;
grant execute on function public.finish_generation(uuid, text, text, real[], real[]) to service_role;
