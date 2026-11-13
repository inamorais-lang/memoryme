-- Diagnostics: what the pet check saw (only the animal: description and flags), to understand wrong faces.
alter table public.generations add column if not exists check_info jsonb;
