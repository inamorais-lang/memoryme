-- Spanish (Spain) and French (France): 11 modes and 15 scenes each.
-- Image prompts are the English ones, except Christmas dinner (and Three Kings' morning in Spain), adapted to each country.
-- English is shared by the UK and the US (only the spelling of the AI line changes, see generations.spelling).
alter table public.personalities drop constraint personalities_language_check,
  add constraint personalities_language_check check (language in ('pt-PT', 'en', 'es', 'fr'));
alter table public.personalities drop constraint personalities_markets_check,
  add constraint personalities_markets_check check (markets <@ array['PT', 'ES', 'FR', 'GB', 'US']);
alter table public.scenes drop constraint scenes_language_check,
  add constraint scenes_language_check check (language in ('pt-PT', 'en', 'es', 'fr'));

-- English spelling for the AI line (colour/color); null for other languages.
alter table public.generations add column spelling text check (spelling is null or spelling in ('GB', 'US'));

insert into public.personalities (id, language, name, tagline, voice_prompt, image_prompt, sort_order, markets)
  select 'es-diva', 'es', 'Diva', 'Exige admiración. Tú eres su fotógrafo personal.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (Spanish): "Esta es mi mejor luz. De nada." / "Más fotos. Aún no has captado mi esencia."'), image_prompt, 10, array['ES'] from public.personalities where id = 'en-diva'
union all
  select 'es-esfomeado', 'es', 'Hambriento', 'Comió hace cinco minutos. Se está muriendo.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (Spanish): "Comí hace cinco minutos. Me muero de hambre." / "Este cuenco está vacío. Exijo explicaciones."'), image_prompt, 20, array['ES'] from public.personalities where id = 'en-esfomeado'
union all
  select 'es-dramatico', 'es', 'Dramático', 'Cada baño es una tragedia. Cada no, una traición.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (Spanish): "Cerraron la puerta. Nunca seré el mismo." / "Me bañaron. Que conste en acta."'), image_prompt, 30, array['ES'] from public.personalities where id = 'en-dramatico'
union all
  select 'es-vilao', 'es', 'Villano', 'Planea dominar la casa. Empieza por el vaso.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (Spanish): "Tiré el vaso de la mesa. Por la ciencia." / "Hoy el sofá. Mañana, la casa entera."'), image_prompt, 40, array['ES'] from public.personalities where id = 'en-vilao'
union all
  select 'es-preguicoso', 'es', 'Perezoso', 'Dormir no es un hábito. Es una carrera.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (Spanish): "Me desperté para comer. Vuelvo a dormir." / "¿Moverme? Hoy no. Quizá mañana."'), image_prompt, 50, array['ES'] from public.personalities where id = 'en-preguicoso'
union all
  select 'es-ciumento', 'es', 'Celoso', 'El móvil, el otro animal y el bebé son enemigos.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (Spanish): "Miraste el móvil. Lo vi todo." / "El otro gato recibió mimos. Esto es la guerra."'), image_prompt, 60, array['ES'] from public.personalities where id = 'en-ciumento'
union all
  select 'es-caotico', 'es', 'Caótico', 'Carreras a las tres de la mañana. El papel higiénico no tiene nada que hacer.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (Spanish): "Son las tres de la mañana. Hora de correr." / "No fui yo. Fui yo, pero no hay pruebas."'), image_prompt, 70, array['ES'] from public.personalities where id = 'en-caotico'
union all
  select 'es-critico', 'es', 'Crítico', 'Puntúa la comida y el servicio. Nunca más de dos estrellas.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (Spanish): "¿Pienso seco otra vez? Dos estrellas." / "El servicio tardó. Sin propina."'), image_prompt, 80, array['ES'] from public.personalities where id = 'en-critico'
union all
  select 'es-ferias', 'es', 'Vacaciones', 'Flotador, cóctel y cero responsabilidades.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (Spanish): "Hoy no ladro. Estoy de vacaciones." / "Más hielo, humano. Y menos preguntas."'), image_prompt, 90, array['ES'] from public.personalities where id = 'en-ferias'
union all
  select 'es-domingo', 'es', 'Domingo', 'Sofá, mando en la pata y ningún plan.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (Spanish): "Domingo. El mando es mío. El sofá también." / "¿Paseo? Están echando mi programa."'), image_prompt, 100, array['ES'] from public.personalities where id = 'en-domingo'
union all
  select 'es-vinho', 'es', 'Hora del Vino', 'Una copa, unas vistas y mucha clase.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (Spanish): "Notas de atún. Excelente cosecha." / "Una copa después del baño. Me la gané."'), image_prompt, 110, array['ES'] from public.personalities where id = 'en-vinho';

insert into public.scenes (id, language, name, sort_order, exaggerated, category, image_prompt, active)
  select 'es-sorriso', 'es', 'Sonrisa con dientes', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-sorriso'
union all
  select 'es-olhos', 'es', 'Ojos como platos', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-olhos'
union all
  select 'es-oculos', 'es', 'Gafas', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-oculos'
union all
  select 'es-cabelo', 'es', 'Peinado nuevo', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-cabelo'
union all
  select 'es-narigudo', 'es', 'Narizotas', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-narigudo'
union all
  select 'es-pose', 'es', 'Pose ridícula', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-pose'
union all
  select 'es-praia', 'es', 'Día de playa', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-praia'
union all
  select 'es-snowboard', 'es', 'Snowboard', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-snowboard'
union all
  select 'es-natal-compras', 'es', 'Compras de Navidad', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-natal-compras'
union all
  select 'es-consoada', 'es', 'Nochebuena', sort_order, exaggerated, category, 'Spanish Christmas Eve dinner (Nochebuena): the pet sits at a festive table with a white napkin tied around its neck, candles, a red tablecloth, a plate of prawns, sliced Iberian ham and a tray of turrón and polvorones, warm and bright.', active from public.scenes where id = 'en-consoada'
union all
  select 'es-embrulhar', 'es', 'Envolver regalos', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-embrulhar'
union all
  select 'es-manha-natal', 'es', 'Mañana de Reyes', sort_order, exaggerated, category, 'Three Kings'' Day morning in Spain: the pet wears a little golden paper crown and festive pyjamas next to a pile of wrapped presents left by the Three Wise Men, with a roscón de Reyes cake on the table and torn wrapping paper on the floor, morning sunlight, bright and joyful.', active from public.scenes where id = 'en-manha-natal'
union all
  select 'es-rena', 'es', 'Reno de Papá Noel', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-rena'
union all
  select 'es-mercado-natal', 'es', 'Mercadillo de Navidad', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-mercado-natal'
union all
  select 'es-natal', 'es', 'Navidad en casa', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-natal';

insert into public.personalities (id, language, name, tagline, voice_prompt, image_prompt, sort_order, markets)
  select 'fr-diva', 'fr', 'Diva', 'Exige d’être admirée. Tu es son photographe perso.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (French): "C’est ma meilleure lumière. De rien." / "Encore des photos. Tu n’as pas saisi mon essence."'), image_prompt, 10, array['FR'] from public.personalities where id = 'en-diva'
union all
  select 'fr-esfomeado', 'fr', 'Affamé', 'A mangé il y a cinq minutes. Dépérit.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (French): "J’ai mangé il y a cinq minutes. Je dépéris." / "Cette gamelle est vide. J’exige des explications."'), image_prompt, 20, array['FR'] from public.personalities where id = 'en-esfomeado'
union all
  select 'fr-dramatico', 'fr', 'Dramatique', 'Chaque bain est une tragédie. Chaque non, une trahison.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (French): "Ils ont fermé la porte. Je ne m’en remettrai pas." / "On m’a lavé. Que l’histoire s’en souvienne."'), image_prompt, 30, array['FR'] from public.personalities where id = 'en-dramatico'
union all
  select 'fr-vilao', 'fr', 'Méchant', 'Prépare la conquête de la maison. Commence par le verre.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (French): "J’ai fait tomber le verre. Pour la science." / "Aujourd’hui le canapé. Demain, le monde."'), image_prompt, 40, array['FR'] from public.personalities where id = 'en-vilao'
union all
  select 'fr-preguicoso', 'fr', 'Paresseux', 'Dormir n’est pas une habitude. C’est une carrière.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (French): "Réveillé pour manger. Je me rendors." / "Bouger ? Pas aujourd’hui. Peut-être demain."'), image_prompt, 50, array['FR'] from public.personalities where id = 'en-preguicoso'
union all
  select 'fr-ciumento', 'fr', 'Jaloux', 'Le téléphone, l’autre animal et le bébé sont des ennemis.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (French): "Tu as regardé ton téléphone. J’ai tout vu." / "L’autre chat a eu des caresses. C’est la guerre."'), image_prompt, 60, array['FR'] from public.personalities where id = 'en-ciumento'
union all
  select 'fr-caotico', 'fr', 'Chaotique', 'Courses folles à 3 h du matin. Le papier toilette n’a aucune chance.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (French): "Il est 3 h du matin. L’heure de courir." / "C’est pas moi. Enfin si, mais sans preuves."'), image_prompt, 70, array['FR'] from public.personalities where id = 'en-caotico'
union all
  select 'fr-critico', 'fr', 'Critique', 'Note la nourriture et le service. Jamais plus de deux étoiles.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (French): "Encore des croquettes ? Deux étoiles." / "Service lent. Pas de pourboire."'), image_prompt, 80, array['FR'] from public.personalities where id = 'en-critico'
union all
  select 'fr-ferias', 'fr', 'Vacances', 'Bouée, cocktail et zéro responsabilité.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (French): "Pas d’aboiement aujourd’hui : je suis en vacances." / "Plus de glaçons, humain. Moins de questions."'), image_prompt, 90, array['FR'] from public.personalities where id = 'en-ferias'
union all
  select 'fr-domingo', 'fr', 'Dimanche', 'Canapé, télécommande sous la patte et zéro projet.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (French): "Dimanche. La télécommande est à moi. Le canapé aussi." / "Une promenade ? Mon émission commence."'), image_prompt, 100, array['FR'] from public.personalities where id = 'en-domingo'
union all
  select 'fr-vinho', 'fr', 'L’Heure du Vin', 'Un verre, une vue et beaucoup de classe.', regexp_replace(voice_prompt, 'Tone examples:.*$', 'Tone examples (French): "Notes de thon. Excellent millésime." / "Un verre après le bain. Je l’ai mérité."'), image_prompt, 110, array['FR'] from public.personalities where id = 'en-vinho';

insert into public.scenes (id, language, name, sort_order, exaggerated, category, image_prompt, active)
  select 'fr-sorriso', 'fr', 'Sourire plein de dents', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-sorriso'
union all
  select 'fr-olhos', 'fr', 'Yeux écarquillés', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-olhos'
union all
  select 'fr-oculos', 'fr', 'Lunettes', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-oculos'
union all
  select 'fr-cabelo', 'fr', 'Nouvelle coiffure', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-cabelo'
union all
  select 'fr-narigudo', 'fr', 'Gros nez', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-narigudo'
union all
  select 'fr-pose', 'fr', 'Pose ridicule', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-pose'
union all
  select 'fr-praia', 'fr', 'Journée à la plage', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-praia'
union all
  select 'fr-snowboard', 'fr', 'Snowboard', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-snowboard'
union all
  select 'fr-natal-compras', 'fr', 'Shopping de Noël', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-natal-compras'
union all
  select 'fr-consoada', 'fr', 'Réveillon de Noël', sort_order, exaggerated, category, 'French Christmas Eve dinner (réveillon): the pet sits at a festive table with a white napkin tied around its neck, candles, a red tablecloth, a chocolate bûche de Noël, a platter of seafood and festive bread, warm and bright.', active from public.scenes where id = 'en-consoada'
union all
  select 'fr-embrulhar', 'fr', 'Paquets cadeaux', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-embrulhar'
union all
  select 'fr-manha-natal', 'fr', 'Matin de Noël', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-manha-natal'
union all
  select 'fr-rena', 'fr', 'Renne du Père Noël', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-rena'
union all
  select 'fr-mercado-natal', 'fr', 'Marché de Noël', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-mercado-natal'
union all
  select 'fr-natal', 'fr', 'Noël à la maison', sort_order, exaggerated, category, image_prompt, active from public.scenes where id = 'en-natal';
