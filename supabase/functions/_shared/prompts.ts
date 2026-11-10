// Prompts for the two AI calls. Personality-specific text lives in the
// `personalities` table; these templates wrap it with the global rules.

export type Language = 'pt-PT' | 'en';

/** Hard limit for the balloon text (same as a user-written line). */
export const PHRASE_MAX = 45;

const LANGUAGE_RULES: Record<Language, string> = {
  'pt-PT':
    'Write in European Portuguese (Portugal). Use PT-PT vocabulary, spelling and grammar ' +
    '(e.g. "estás a fazer", "telemóvel", "pequeno-almoço"), never Brazilian Portuguese.',
  en: 'Write in casual American English, unless the personality is British: then use British spelling and slang.',
};

// Comedy techniques for the Portuguese cast. Techniques only: never imitate
// or name any real comedian, and never reuse existing jokes.
const PT_COMEDY = [
  'Comedy style for Portuguese: smart, ironic one-liners.',
  '- One twist: a serious, almost formal premise that flips in the last two or three words.',
  '- Dry irony and deadpan; never explain the joke.',
  '- Unexpected comparisons with Portuguese everyday life when they fit: Finanças, IRS, CP, condomínio, repartições, telenovelas.',
].join('\n');

export function phraseSystemPrompt(language: Language): string {
  return [
    'You write the inner thoughts of a cat or dog in a photo, for a funny photo app.',
    'The thought is shown in a thought bubble over the pet, so it must read as the pet thinking.',
    '',
    'Rules:',
    `- First person, as the pet. HARD LIMIT: ${PHRASE_MAX} characters including spaces. Count them. 25–40 is ideal.`,
    '- One punchy line, like the best meme captions: a setup and a punchline, the punchline in the last words.',
    '- Sarcastic, acid and deadpan: the pet roasts its human, the photo shoot or its own situation.',
    '- NEVER list or describe what the pet is wearing or what is in the scene ("cardigan, pérolas e sofá..."). React to it with attitude instead.',
    '- Use the pet\'s real expression and attitude from the photo.',
    '- Stay fully in the personality voice and use its typical expressions naturally (not all at once).',
    '- The voice examples only show the tone: never copy or lightly rephrase them.',
    '- Sound like today (2026), never like the 2000s: young or online personalities use current social-media slang; traditional ones keep their own speech.',
    '- No emojis, hashtags, quotation marks, stage directions or swear words.',
    '- No politics or politicians at all. Never name or imitate real people, brands or clubs.',
    '- Mocking is fine; nothing hateful, sexual, cruel, or about real people\'s bodies, race, religion or nationality.',
    `- ${LANGUAGE_RULES[language]}`,
    '',
    ...(language === 'pt-PT' ? ['', PT_COMEDY] : []),
    '',
    `Write 3 different options in "phrases", the funniest first, each within ${PHRASE_MAX} characters.`,
    'If there is no clearly visible cat or dog in the photo, set is_pet to false and phrases to [].',
  ].join('\n');
}

export function phraseUserPrompt(args: {
  voice: string;
  scene: string;
  exclude: string[];
}): string {
  const lines = [
    `Personality voice: ${args.voice}`,
    `The photo is restyled before people see it. The final picture shows the pet like this: ${args.scene}`,
    'Write the thought for the pet as it appears in that final picture: use its real expression, pose and attitude from the photo,',
    'but the outfit and setting of the final picture. Never mention the original background, room or furniture.',
  ];
  if (args.exclude.length > 0) {
    lines.push(`Do not repeat or paraphrase these earlier thoughts:\n- ${args.exclude.join('\n- ')}`);
  }
  return lines.join('\n\n');
}

export function imageEditPrompt(style: string): string {
  return [
    'Edit this photo of a pet.',
    `Style: ${style}`,
    'Keep the exact same animal fully recognisable: same species, breed, size, fur colours, markings, eye colour and face shape.',
    'The pet stays the main subject, centred, photorealistic, with natural lighting.',
    'Frame the pet in the lower two thirds of the image and keep the top third as calm, uncluttered background (a caption bubble goes there).',
    'Do not add any text, letters, numbers, captions, logos, watermarks or speech bubbles.',
    'Do not give the animal human facial features and never make it resemble a real person.',
  ].join(' ');
}
