import type { AppLanguage, Market } from '@/i18n';

export type Personality = {
  id: string;
  language: AppLanguage;
  name: string;
  tagline: string;
  /** Phase 1 only: local phrases. From Phase 2 the AI writes them. */
  phrases: string[];
};

/**
 * Content, not UI copy: each language has its own cast.
 * Never use names, photos or quotes of real people (App Store 5.2).
 * From Phase 2 this list comes from the server.
 */
/**
 * The pets speak as pets: 8 universal moods, the same in every language.
 * Names and taglines mirror the server; phrases are only used offline.
 */
export const personalities: Personality[] = [
  { id: "pt-diva", language: 'pt-PT', name: "Diva", tagline: "Exige ser admirado. Tu és o fotógrafo pessoal.", phrases: ["Esta é a minha melhor luz. De nada.", "O meu lado bom? São os dois.", "Fotos sem pedir? Fala com o meu agente.", "Ilumina-me melhor, humano.", "Nasci para isto. Tu, para me servir."] },
  { id: "pt-esfomeado", language: 'pt-PT', name: "Esfomeado", tagline: "Comeu há cinco minutos. Está a definhar.", phrases: ["Comi há cinco minutos. Estou a definhar.", "A tigela está meio vazia. Quase morri.", "Isso que comes é meu. Partilhar é amar.", "Ouvi o frigorífico. Vim a correr.", "Já jantei? Não me lembro. Serve outra vez."] },
  { id: "pt-dramatico", language: 'pt-PT', name: "Dramático", tagline: "Cada banho é uma tragédia. Cada não, uma traição.", phrases: ["Fecharam a porta. Nunca mais serei o mesmo.", "Deram-me banho. Que fique registado.", "Saíste cinco minutos. Envelheci dez anos.", "O jantar atrasou. Escrevi o testamento.", "Ninguém me ama. Só me dão comida e festas."] },
  { id: "pt-vilao", language: 'pt-PT', name: "Vilão", tagline: "Planeia dominar a casa. Começa pelo copo na mesa.", phrases: ["Deitei o copo da mesa. Foi pela ciência.", "Hoje o sofá. Amanhã, a casa toda.", "O aspirador sabe demasiado.", "Sorrio porque já escolhi o próximo copo.", "O carteiro voltou. Desta vez é pessoal."] },
  { id: "pt-preguicoso", language: 'pt-PT', name: "Preguiçoso", tagline: "Dormir não é um hábito. É uma carreira.", phrases: ["Acordei para comer. Volto a dormir já.", "Mexer-me? Hoje não. Talvez amanhã.", "Dormi doze horas. Preciso de descansar.", "O sol mudou de sítio. Que trabalheira.", "Não estou a dormir. Estou a poupar energia."] },
  { id: "pt-ciumento", language: 'pt-PT', name: "Ciumento", tagline: "O telemóvel, o outro animal e o bebé são inimigos.", phrases: ["Olhaste para o telemóvel. Eu vi tudo.", "O outro bicho teve festas. É a guerra.", "Esse portátil não te ama como eu.", "Fizeste festas ao vizinho. Traidor.", "Eu ou o telemóvel. Escolhe bem."] },
  { id: "pt-caotico", language: 'pt-PT', name: "Caótico", tagline: "Às três da manhã, faz corridas. E destrói o papel higiénico.", phrases: ["São três da manhã. Hora de correr.", "Não fui eu. Fui eu, mas não há provas.", "O papel higiénico desafiou-me. Perdeu.", "Arrumaste a casa? Que pena.", "Corri pela casa toda. Não sei porquê."] },
  { id: "pt-critico", language: 'pt-PT', name: "Crítico", tagline: "Avalia a comida e o serviço. Nunca dá mais de duas estrelas.", phrases: ["Ração seca outra vez? Duas estrelas.", "O serviço demorou. Gorjeta cancelada.", "Almofada fria. Uma estrela.", "O empregado distraiu-se com o telemóvel.", "Prato bonito. Porção ridícula."] },
  { id: "pt-ferias", language: 'pt-PT', name: "Férias", tagline: "Boia, cocktail e zero responsabilidades.", phrases: ["Hoje não ladro. Estou de férias.", "Mais gelo, humano. E menos perguntas.", "Sol, piscina e ninguém a chamar-me.", "Volto ao trabalho? Que trabalho?", "Protetor solar? Tenho pelo, humano."] },
  { id: "pt-domingo", language: 'pt-PT', name: "Domingo", tagline: "Sofá, comando na pata e nenhum plano.", phrases: ["Domingo. O comando é meu. O sofá também.", "Passeio? Está a dar o meu programa.", "Mudei de canal 40 vezes. Cansei-me.", "Hoje só me levanto para comer.", "O sofá e eu temos uma relação séria."] },
  { id: "pt-vinho", language: 'pt-PT', name: "Hora do Vinho", tagline: "Um copo, uma vista e muita classe.", phrases: ["Notas de atum. Excelente colheita.", "Um copo depois do banho. Mereci.", "Brindo ao humano que me serve.", "Vista bonita. Petiscos pequenos.", "Aprecio o vinho. E o queijo, mais."] },
  { id: "en-diva", language: 'en', name: "Diva", tagline: "Demands admiration. You are the personal photographer.", phrases: ["This is my best light. You're welcome.", "Both sides are my good side.", "No photos without my agent.", "Light me properly, human.", "Born for this. You, to serve me."] },
  { id: "en-esfomeado", language: 'en', name: "Always Hungry", tagline: "Ate five minutes ago. Is wasting away.", phrases: ["Ate five minutes ago. I'm wasting away.", "The bowl is half empty. I almost died.", "What you're eating is mine.", "I heard the fridge. I came running.", "Did I eat? Can't recall. Serve again."] },
  { id: "en-dramatico", language: 'en', name: "Dramatic", tagline: "Every bath is a tragedy. Every no, a betrayal.", phrases: ["They closed the door. I will never recover.", "I was bathed. Let history remember.", "You left for five minutes. I aged ten years.", "Dinner was late. I wrote my will.", "Nobody loves me. Only food and belly rubs."] },
  { id: "en-vilao", language: 'en', name: "Villain", tagline: "Plotting to rule the house. Starting with that glass.", phrases: ["Knocked it off the table. For science.", "Today the couch. Tomorrow, the world.", "The vacuum knows too much.", "I smile because I picked the next glass.", "The mailman is back. Now it's personal."] },
  { id: "en-preguicoso", language: 'en', name: "Lazy", tagline: "Napping is not a habit. It is a career.", phrases: ["Woke up to eat. Going back to sleep.", "Move? Not today. Maybe tomorrow.", "Slept twelve hours. I need a rest.", "The sun moved. So much work.", "Not sleeping. Saving energy."] },
  { id: "en-ciumento", language: 'en', name: "Jealous", tagline: "The phone, the other pet and the baby are enemies.", phrases: ["You looked at your phone. I saw it all.", "The other pet got petted. This is war.", "That laptop doesn't love you like I do.", "You petted the neighbor's dog. Traitor.", "Me or the phone. Choose wisely."] },
  { id: "en-caotico", language: 'en', name: "Chaos Gremlin", tagline: "Zoomies at 3am. Toilet paper never stood a chance.", phrases: ["It's 3am. Time to run.", "Wasn't me. It was me, but no proof.", "The toilet paper challenged me. It lost.", "You cleaned the house? Shame.", "Ran around the whole house. No idea why."] },
  { id: "en-critico", language: 'en', name: "The Critic", tagline: "Rates the food and the service. Never more than two stars.", phrases: ["Dry food again? Two stars.", "Slow service. No tip today.", "Cold cushion. One star.", "The waiter got distracted by his phone.", "Lovely plate. Ridiculous portion."] },
  { id: "en-ferias", language: 'en', name: "Vacation Mode", tagline: "Pool float, cocktail, zero responsibilities.", phrases: ["Not barking today. I'm on vacation.", "More ice, human. Fewer questions.", "Sun, pool, nobody calling my name.", "Back to work? What work?", "Sunscreen? I have fur, human."] },
  { id: "en-domingo", language: 'en', name: "Sunday Mode", tagline: "Couch, remote in paw, no plans at all.", phrases: ["Sunday. I own the remote. And the couch.", "A walk? My show is on.", "Changed channels 40 times. Exhausted.", "Only getting up to eat today.", "The couch and I are in a relationship."] },
  { id: "en-vinho", language: 'en', name: "Wine Time", tagline: "A glass, a view and a lot of class.", phrases: ["Notes of tuna. Excellent vintage.", "One glass after bath time. I earned it.", "A toast to the human who serves me.", "Lovely view. Tiny snacks.", "I appreciate the wine. The cheese, more."] },
];

/** Mirrors the `markets` column on the server. */
export function marketsOf(p: Personality): Market[] {
  return p.language === 'pt-PT' ? ['PT'] : ['US', 'GB'];
}

export function personalitiesForMarket(market: Market): Personality[] {
  return personalities.filter((p) => marketsOf(p).includes(market));
}

export function personalitiesFor(language: AppLanguage): Personality[] {
  return personalities.filter((p) => p.language === language);
}

export function findPersonality(id: string): Personality | undefined {
  return personalities.find((p) => p.id === id);
}
