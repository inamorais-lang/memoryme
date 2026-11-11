-- Where the pet's head is in the final image (x, y, w, h as fractions 0..1),
-- written by the AI with the phrase. The app keeps the balloon and its dots
-- off the face. Read-only for users (select on the whole table already granted).

alter table public.generations
  add column head real[] check (
    head is null or (
      array_length(head, 1) = 4
      and head[1] between 0 and 1 and head[2] between 0 and 1
      and head[3] between 0 and 1 and head[4] between 0 and 1
    )
  );

drop function public.finish_generation(uuid, text, text);

create function public.finish_generation(
  p_generation_id uuid,
  p_image_path text,
  p_phrase text,
  p_head real[] default null
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
      completed_at = now()
  where id = p_generation_id and status = 'pending';
  return found;
end;
$$;

revoke all on function public.finish_generation(uuid, text, text, real[]) from public, anon, authenticated;
grant execute on function public.finish_generation(uuid, text, text, real[]) to service_role;
