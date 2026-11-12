-- Lines people wrote themselves ("Escrever a minha frase") that the owner stars on the admin page.
-- They become style examples for the AI (imitated, never copied). Anonymous: no link to the person
-- or to the picture is kept (privacy policy).
create table public.phrase_examples (
  id bigint generated always as identity primary key,
  language text not null check (language in ('pt-PT', 'en', 'es', 'fr')),
  text text not null check (char_length(text) between 1 and 45),
  created_at timestamptz not null default now(),
  unique (language, text)
);
alter table public.phrase_examples enable row level security;
-- No policies and no grants: only the service role (Edge Functions) reads and writes it.
revoke all on public.phrase_examples from public, anon, authenticated;
