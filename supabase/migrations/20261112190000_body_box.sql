-- Where the pet's whole body is (x, y, w, h fractions 0..1): the balloon avoids the face
-- first, then the body, then the main prop (the balloon covered too much of the pet).
alter table public.generations
  add column body real[] check (
    body is null or (
      array_length(body, 1) = 4
      and body[1] between 0 and 1 and body[2] between 0 and 1
      and body[3] between 0 and 1 and body[4] between 0 and 1
    )
  );

drop function public.finish_generation(uuid, text, text, real[], real[]);

create function public.finish_generation(
  p_generation_id uuid,
  p_image_path text,
  p_phrase text,
  p_head real[] default null,
  p_prop real[] default null,
  p_body real[] default null
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
      body = p_body,
      completed_at = now()
  where id = p_generation_id and status = 'pending';
  return found;
end;
$$;

revoke all on function public.finish_generation(uuid, text, text, real[], real[], real[]) from public, anon, authenticated;
grant execute on function public.finish_generation(uuid, text, text, real[], real[], real[]) to service_role;
