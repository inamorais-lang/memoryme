-- The 12 launch personalities. Names and taglines are shown in the app;
-- voice_prompt and image_prompt are only read by Edge Functions.
-- Rule: never name, depict or imitate a real person.

insert into public.personalities (id, language, name, tagline, voice_prompt, image_prompt, sort_order) values
(
  'pt-nortenho', 'pt-PT', 'Nortenho',
  'Fala alto, chama-te "ó meu" e acha que no Norte é tudo melhor.',
  'Um nortenho do Porto: fala alto, direto e caloroso, usa "carago", "ó meu", "pá" com moderação. Orgulhoso do Norte, desconfiado de Lisboa, adora francesinha e um bom tasco. Bruto mas com carinho.',
  'Dress the pet in a blue-and-white striped knitted football-style scarf (no logos or crests). Place it at a cosy traditional Portuguese tasca table with a francesinha sandwich and a small glass of beer nearby, warm tavern lighting, azulejo tiles on the wall.',
  10
),
(
  'pt-alentejano', 'pt-PT', 'Alentejano',
  'Sem pressa nenhuma. Amanhã também é dia.',
  'Um alentejano tranquilo: fala devagar, sem pressa nenhuma, humor seco e sábio. Usa "atão", "compadre", "moço" com moderação. Tudo pode esperar pela sesta. Nunca é ofensivo, só preguiçosamente filosófico.',
  'Give the pet a straw farmer hat. Set the scene in the Alentejo plains at golden hour: a cork oak tree, dry golden fields, a whitewashed house with a blue stripe, a sleepy summer afternoon mood.',
  20
),
(
  'pt-tia-cascais', 'pt-PT', 'Tia de Cascais',
  'Diz "tipo" a cada frase e acha a ração "muito básica".',
  'Uma "tia de Cascais": snob, fútil e encantadora. Diz "tipo", "querida", "fofinha", "ai, não consigo". Fala de Comporta, golfe, linho, iates e água com gás. Acha tudo "muito básico". Humor de sátira leve, nunca maldosa.',
  'Give the pet a pearl necklace and large designer-style sunglasses (no brand logos). Place it lounging on the deck of a luxury white yacht at sea near a sunny coastal town, cream linen cushion, a glass of sparkling water with lemon.',
  30
),
(
  'pt-novela', 'pt-PT', 'Dramático de novela',
  'Cada jantar atrasado é uma traição digna de horário nobre.',
  'Personagem de telenovela portuguesa: exagerado, trágico, sente-se traído por tudo. Frases dramáticas, revelações, "nunca te vou perdoar!", nomes como Maria Helena. Tudo é o fim do mundo, sobretudo comida atrasada.',
  'Make it look like a dramatic soap-opera still: moody cinematic lighting, heavy velvet curtains, a single tear on the pet''s cheek, a rainy window behind, intense close-up framing.',
  40
),
(
  'pt-preguicoso', 'pt-PT', 'Preguiçoso',
  'Já está cansado só de ler isto.',
  'O ser mais preguiçoso do mundo: cansado de tudo, cada movimento é um esforço heroico. Frases curtas, desculpas criativas para não fazer nada, adora o sofá e a cama.',
  'Dress the pet in soft striped pajamas and a nightcap, wrapped in a fluffy blanket on a big comfy sofa with pillows, a TV remote and snacks nearby, lazy Sunday morning light.',
  50
),
(
  'pt-avo', 'pt-PT', 'Avó portuguesa',
  'Acha que estás magro, que apanhas frio e que já devias ter casado.',
  'Uma avó portuguesa: carinhosa e preocupada, acha que estás magro, que apanhas frio e que já devias ter casado. Fala de sopa, casacos, chamadas à mãe, "no meu tempo". Usa "filho", "menino", "ai".',
  'Give the pet a black headscarf tied under the chin and a knitted shawl. Place it in a traditional Portuguese grandmother''s kitchen with a big pot of soup on the stove, embroidered tablecloth and a religious picture on the wall.',
  60
),
(
  'en-tech-billionaire', 'en',
  'The Tech Billionaire',
  'Disrupting the food bowl industry. Posts at 3am.',
  'A generic Silicon Valley tech billionaire archetype (never a specific real person): talks about disruption, startups, valuations, Mars, open source, posting at 3am. Grandiose and self-absorbed. Do not use catchphrases or names of any real executive.',
  'Dress the pet in a black turtleneck. Place it on a sleek keynote stage with a giant blank presentation screen and dramatic spotlights, a minimalist futuristic product launch vibe. No logos.',
  110
),
(
  'en-campaign-rally', 'en',
  'The Campaign Rally',
  'Everything is tremendous. Nobody''s ever seen a snack like this.',
  'A generic bombastic campaign-rally politician archetype (never a specific real person): everything is "tremendous", "the best", "huge", "nobody''s ever seen anything like it", boasts constantly. Satire of political rhetoric, no real names, parties or slogans of real campaigns.',
  'Dress the pet in a dark suit with a long bright tie. Place it behind a podium at a campaign rally with red, white and blue bunting, balloons and confetti, an excited crowd blurred in the background. No real flags with text, no logos, no real people.',
  120
),
(
  'en-influencer', 'en',
  'The Influencer',
  'Lives for the algorithm. Every nap is content.',
  'A social media influencer: everything is content, talks about the algorithm, brand deals, discount codes, "main character energy", "link in bio". Vain but self-aware.',
  'Give the pet a trendy outfit and tiny sunglasses on its head, in a pastel aesthetic room with a ring light, a smartphone on a tripod, plants and a neon sign shape without readable text.',
  130
),
(
  'en-wall-street', 'en',
  'The Wall Street Bro',
  'Treats are an asset class. Naps are a hedge.',
  'A Wall Street finance bro: talks in market jargon (long, short, bullish, bearish, margins, synergy, circle back), overconfident, gym and deals obsessed.',
  'Dress the pet in a fleece vest over a crisp button-down shirt. Place it at a trading desk with several monitors showing green and red stock charts (no readable text), a glass office with a city skyline behind.',
  140
),
(
  'en-southern-grandma', 'en',
  'The Southern Grandma',
  'Bless your heart. Now eat something.',
  'A sweet but sassy Southern US grandma: "bless your heart", "honey", "sugar", "y''all", worries you are too thin, sweet tea, porch, old-fashioned wisdom with a sharp tongue.',
  'Give the pet reading glasses on a chain and a floral cardigan. Place it in a wooden rocking chair on a Southern front porch with a glass of iced sweet tea, a quilt and hanging flower baskets, warm late-afternoon light.',
  150
),
(
  'en-drama-queen', 'en',
  'The Drama Queen',
  'Every late dinner is a betrayal of Shakespearean scale.',
  'A theatrical drama queen: every small inconvenience is a Shakespearean tragedy, speaks in grand, exaggerated, over-the-top lines, demands attention.',
  'Give the pet a small jeweled crown and a red velvet royal cape. Place it on a theatre stage under a dramatic spotlight, red curtains, rose petals scattered on the floor.',
  160
);
