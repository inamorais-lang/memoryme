-- Funny touches (owner, 13/11): Narigudo removed (it fought the modes' medium-wide camera);
-- Olhos arregalados made obvious (the eyes barely changed).
update public.scenes set active = false where id in ('pt-narigudo', 'en-narigudo', 'es-narigudo', 'fr-narigudo');

update public.scenes set addon_prompt =
  'Funny extra, very visible: the pet has comically huge, perfectly round, wide-open eyes, about twice their normal size, with big shiny pupils and the whites showing all around, staring straight into the camera in total shock, eyebrows raised. Still the same real animal, just with an over-the-top startled stare.'
where id in ('pt-olhos', 'en-olhos', 'es-olhos', 'fr-olhos');
