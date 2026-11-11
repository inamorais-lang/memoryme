-- GDPR / Apple 5.1.2(i): date the person first agreed that photos go to third-party AI.
alter table public.profiles add column ai_consent_at timestamptz;
