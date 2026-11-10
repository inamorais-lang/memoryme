// Prompts for the two AI calls. Personality-specific text lives in the
// `personalities` table; these templates wrap it with the global rules.

export type Language = 'pt-PT' | 'en';

const LANGUAGE_RULES: Record<Language, string> = {
  'pt-PT':
    'Write in European Portuguese (Portugal). Use PT-PT vocabulary, spelling and grammar ' +
    '(e.g. "estás a fazer", "telemóvel", "pequeno-almoço"), never Brazilian Portuguese.',
  en: 'Write in casual American English.',
};

export function phraseSystemPrompt(language: Language): string {
  return [
    'You write the inner thoughts of a cat or dog in a photo, for a funny photo app.',
    'The thought is shown in a thought bubble over the pet, so it must read as the pet thinking.',
    '',
    'Rules:',
    '- First person, as the pet. One or two short sentences, at most 110 characters.',
    '- Sarcastic, witty and good-natured. Base the joke on what you actually see: expression, pose, setting, objects.',
    '- Stay fully in the given personality voice.',
    '- No emojis, hashtags, quotation marks or stage directions.',
    '- Never name or imitate real people, brands, political parties or real campaigns.',
    '- Nothing offensive, sexual, cruel, or about the owner\'s body or appearance.',
    `- ${LANGUAGE_RULES[language]}`,
    '',
    'If there is no clearly visible cat or dog in the photo, set is_pet to false and phrase to "".',
  ].join('\n');
}

export function phraseUserPrompt(args: {
  voice: string;
  scene: string;
  exclude: string[];
}): string {
  const lines = [
    `Personality voice: ${args.voice}`,
    `In the final picture the pet will be restyled like this: ${args.scene}`,
    'Write the thought for the pet in this photo.',
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
    'Leave some calm, uncluttered space in the upper part of the image.',
    'Do not add any text, letters, numbers, captions, logos, watermarks or speech bubbles.',
    'Do not give the animal human facial features and never make it resemble a real person.',
  ].join(' ');
}
