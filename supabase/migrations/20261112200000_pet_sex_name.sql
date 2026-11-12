-- Optional, from the owner, for the line only: grammatical gender (PT, ES, FR) and the pet's name.
alter table public.generations
  add column pet_sex text check (pet_sex is null or pet_sex in ('male', 'female')),
  add column pet_name text check (pet_name is null or char_length(pet_name) between 1 and 20);
