-- Christmas pack: 7 scenes shown as their own "Natal" group at the top.
-- To hide them after the season: update public.scenes set active = false where category = 'natal';
alter table public.scenes add column category text;
grant select (category) on public.scenes to anon, authenticated;

update public.scenes set category = 'natal', sort_order = 106, name = 'Natal em casa' where id = 'pt-natal';
update public.scenes set category = 'natal', sort_order = 106, name = 'Christmas at home' where id = 'en-natal';

insert into public.scenes (id, language, name, sort_order, exaggerated, category, image_prompt) values
('pt-natal-compras', 'pt-PT', 'Compras de Natal', 100, false, 'natal', 'Christmas shopping: the pet sits on a festive shopping street full of bright Christmas lights and decorated shop windows, next to a shopping trolley overflowing with wrapped presents and colourful shopping bags, wearing a cosy scarf. Bright and cheerful.'),
('pt-consoada', 'pt-PT', 'Consoada', 101, false, 'natal', 'Portuguese Christmas Eve dinner: the pet sits at a festive table with a white napkin tied around its neck, candles, a red tablecloth and dishes of salted cod (bacalhau) with boiled potatoes and greens, warm and bright.'),
('pt-embrulhar', 'pt-PT', 'Embrulhar presentes', 102, false, 'natal', 'Gift wrapping gone wrong: the pet is tangled in shiny wrapping paper and curly ribbons, surrounded by half-wrapped boxes, bows and rolls of colourful paper on the floor, with a slightly guilty look.'),
('pt-manha-natal', 'pt-PT', 'Manhã de Natal', 103, false, 'natal', 'Christmas morning: the pet wears festive red and green pyjamas next to the Christmas tree, surrounded by opened presents and torn wrapping paper everywhere, morning sunlight, bright and joyful.'),
('pt-rena', 'pt-PT', 'Rena do Pai Natal', 104, false, 'natal', 'The pet as one of Santa''s reindeer: soft reindeer antlers on its head and a little red nose, harnessed to a red wooden sleigh full of presents on fresh snow, snowy pine trees and a bright winter sky.'),
('pt-mercado-natal', 'pt-PT', 'Mercado de Natal', 105, false, 'natal', 'A Christmas market in the early evening, glowing with bright fairy lights and colourful wooden stalls: the pet wears a knitted scarf and sits by a small table with a steaming mug of hot chocolate. Well lit and cheerful, never dark.'),
('en-natal-compras', 'en', 'Christmas shopping', 100, false, 'natal', 'Christmas shopping: the pet sits on a festive shopping street full of bright Christmas lights and decorated shop windows, next to a shopping trolley overflowing with wrapped presents and colourful shopping bags, wearing a cosy scarf. Bright and cheerful.'),
('en-consoada', 'en', 'Christmas dinner', 101, false, 'natal', 'Christmas dinner: the pet sits at a festive table with a white napkin tied around its neck, candles, a red tablecloth and a roast turkey with trimmings, warm and bright.'),
('en-embrulhar', 'en', 'Gift wrapping', 102, false, 'natal', 'Gift wrapping gone wrong: the pet is tangled in shiny wrapping paper and curly ribbons, surrounded by half-wrapped boxes, bows and rolls of colourful paper on the floor, with a slightly guilty look.'),
('en-manha-natal', 'en', 'Christmas morning', 103, false, 'natal', 'Christmas morning: the pet wears festive red and green pyjamas next to the Christmas tree, surrounded by opened presents and torn wrapping paper everywhere, morning sunlight, bright and joyful.'),
('en-rena', 'en', 'Santa''s reindeer', 104, false, 'natal', 'The pet as one of Santa''s reindeer: soft reindeer antlers on its head and a little red nose, harnessed to a red wooden sleigh full of presents on fresh snow, snowy pine trees and a bright winter sky.'),
('en-mercado-natal', 'en', 'Christmas market', 105, false, 'natal', 'A Christmas market in the early evening, glowing with bright fairy lights and colourful wooden stalls: the pet wears a knitted scarf and sits by a small table with a steaming mug of hot chocolate. Well lit and cheerful, never dark.');
