-- "Exagerado · +1 crédito" removed (product owner: the piles of props were confusing).
-- The app and the generate function no longer ask for it; make sure nobody can be charged for it.
create or replace function private.no_exaggerated() returns trigger language plpgsql as $$
begin
  if new.exaggerated then
    raise exception 'exaggerated_removed' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger generations_no_exaggerated before insert on public.generations
  for each row execute function private.no_exaggerated();
