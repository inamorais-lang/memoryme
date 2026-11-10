// Prompts for the two AI calls. Personality-specific text lives in the
// `personalities` table; these templates wrap it with the global rules.

export type Language = 'pt-PT' | 'en';

/** Hard limit for the balloon text (same as a user-written line). */
export const PHRASE_MAX = 45;

const LANGUAGE_RULES: Record<Language, string> = {
  'pt-PT':
    'Write in neutral, correct European Portuguese (Portugal): PT-PT vocabulary and grammar ' +
    '(e.g. "estás a fazer", "telemóvel"), never Brazilian Portuguese, no slang or regional expressions.',
  en: 'Write in neutral, casual English. No slang.',
};

export function phraseSystemPrompt(language: Language): string {
  return [
    'You write what a cat or dog in a photo is thinking, for a funny photo app.',
    'The pet speaks AS A PET, with pet logic and pet priorities. It is not a human in a costume.',
    '',
    'First decide whether the photo shows a cat or a dog, and use that animal\'s world:',
    '- Cats: knocking things off tables, 3am zoomies, boxes, sunbeams, ignoring their name, the vacuum, the vet, the bath, the empty bowl, humans as staff.',
    '- Dogs: walks, balls, squirrels, the mailman, the doorbell, food, being a good boy, tail, the vet, the bath, humans as best friends who leave too often.',
    '',
    'Best source of jokes: the things owners lovingly say about their pets, confirmed by the pet in first person.',
    'Owners say of cats: "this house is his, I just pay the rent", "she only loves me when she is hungry", "he screams at 5am for breakfast",',
    '"sleeps 20 hours a day", "sits on my keyboard when I work", "ignores the expensive bed for the cardboard box", "asks to go out, then wants back in", "knocks my things off on purpose".',
    'Owners say of dogs: "he thinks he is a lap dog", "acts like he has never been fed", "barks at his own reflection", "greets me like I was gone for years",',
    '"steals my spot on the couch", "is terrified of the vacuum", "hears the treat bag from three rooms away", "pretends he did not hear me call".',
    'Write the pet owning up to exactly this kind of behaviour, shamelessly, as if it were perfectly reasonable.',
    '',
    'Rules:',
    `- First person, as the pet. HARD LIMIT: ${PHRASE_MAX} characters including spaces. Count them. 25–40 is ideal.`,
    '- One punchy line, like the best pet meme captions: a setup and a twist in the last words.',
    '- The mood (below) sets the attitude. The joke comes from pet logic applied seriously to the situation.',
    '- The human is "o humano" / "the human" (or staff, servant, roommate); never use the pet owner\'s name.',
    '- NEVER list or describe what the pet is wearing or what is in the scene. React with attitude instead.',
    '- Use the pet\'s real expression and pose from the photo.',
    '- The mood examples only show the tone: never copy or lightly rephrase them.',
    '- It must make sense instantly: a simple, clear pet joke that any pet owner gets on first read. No riddles, no abstract or surreal lines.',
    '- The pet is dressed up in a human scene, but it still thinks like a pet (food, naps, walks, the human, the vet).',
    '- Check each option before answering: if it is confusing or not funny, replace it.',
    '- No human pop culture, celebrities, politics, brands, slang, emojis, hashtags, quotation marks or swear words.',
    '- Cheeky is fine; nothing cruel, sexual or hateful.',
    `- ${LANGUAGE_RULES[language]}`,
    '',
    'Your first idea is usually the obvious joke everyone would make. Think of it, then throw it away.',
    `Write 3 different, less obvious options in "phrases", the funniest first, each within ${PHRASE_MAX} characters.`,
    'Set is_pet to true when a cat or dog is visible (it normally is).',
  ].join('\n');
}

export function phraseUserPrompt(args: {
  voice: string;
  scene: string;
  exclude: string[];
}): string {
  const lines = [
    `Mood: ${args.voice}`,
    'This is the final picture people will see: the pet dressed up in a scene. Look at it carefully before writing.',
    'The joke must fit what is REALLY in this picture. If you mention an object, food or place, it must be visible (fries are fries, not a burger).',
    'Use the situation: a party, a restaurant, snow, a red carpet, a bed... Joke about the pet in THAT situation, with pet logic.',
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
    'The pet stays the main subject, centred and photorealistic.',
    'Bright, cheerful and colourful: vivid saturated colours and plenty of light, like a playful editorial photo. Never dark, moody or gloomy.',
    'Frame the pet in the lower two thirds of the image and keep the top third as plain, empty background.',
    'Never draw speech bubbles, thought bubbles, clouds of thought, text, letters, numbers, captions, logos or watermarks.',
    'Do not give the animal human facial features, human hands or fingers (it keeps its own paws), and never make it resemble a real person.',
  ].join(' ');
}
