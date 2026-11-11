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
 * The pets speak as pets: 11 universal modes, the same in every language (PT, EN, ES, FR).
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
  { id: "es-diva", language: 'es', name: "Diva", tagline: "Exige admiración. Tú eres su fotógrafo personal.", phrases: ["Esta es mi mejor luz. De nada.", "¿Mi lado bueno? Los dos.", "¿Fotos sin permiso? Habla con mi agente.", "Ilumíname mejor, humano.", "Nací para esto. Tú, para servirme."] },
  { id: "es-esfomeado", language: 'es', name: "Hambriento", tagline: "Comió hace cinco minutos. Se está muriendo.", phrases: ["Comí hace cinco minutos. Me muero.", "Cuenco medio vacío. Casi me muero.", "Eso que comes es mío. Compartir es amar.", "Oí la nevera. Vine corriendo.", "¿Ya cené? No me acuerdo. Sirve otra vez."] },
  { id: "es-dramatico", language: 'es', name: "Dramático", tagline: "Cada baño es una tragedia. Cada no, una traición.", phrases: ["Cerraron la puerta. Nunca seré el mismo.", "Me bañaron. Que conste en acta.", "Saliste cinco minutos. Envejecí diez años.", "La cena llegó tarde. Hice testamento.", "Nadie me quiere. Solo comida y mimos."] },
  { id: "es-vilao", language: 'es', name: "Villano", tagline: "Planea dominar la casa. Empieza por el vaso.", phrases: ["Tiré el vaso de la mesa. Por la ciencia.", "Hoy el sofá. Mañana, la casa entera.", "La aspiradora sabe demasiado.", "Sonrío: ya elegí el próximo vaso.", "Volvió el cartero. Ahora es personal."] },
  { id: "es-preguicoso", language: 'es', name: "Perezoso", tagline: "Dormir no es un hábito. Es una carrera.", phrases: ["Me desperté para comer. Vuelvo a dormir.", "¿Moverme? Hoy no. Quizá mañana.", "Dormí doce horas. Necesito descansar.", "El sol cambió de sitio. Qué fatiga.", "No duermo. Ahorro energía."] },
  { id: "es-ciumento", language: 'es', name: "Celoso", tagline: "El móvil, el otro animal y el bebé son enemigos.", phrases: ["Miraste el móvil. Lo vi todo.", "El otro bicho tuvo mimos. Es la guerra.", "Ese portátil no te quiere como yo.", "Acariciaste al del vecino. Traidor.", "O yo o el móvil. Elige bien."] },
  { id: "es-caotico", language: 'es', name: "Caótico", tagline: "Carreras a las tres de la mañana. El papel higiénico no tiene nada que hacer.", phrases: ["Son las tres. Hora de correr.", "No fui yo. Fui yo, pero no hay pruebas.", "El papel higiénico me retó. Perdió.", "¿Ordenaste la casa? Qué pena.", "Corrí por toda la casa. No sé por qué."] },
  { id: "es-critico", language: 'es', name: "Crítico", tagline: "Puntúa la comida y el servicio. Nunca más de dos estrellas.", phrases: ["¿Pienso seco otra vez? Dos estrellas.", "El servicio tardó. Sin propina.", "Cojín frío. Una estrella.", "El camarero se distrajo con el móvil.", "Plato bonito. Ración ridícula."] },
  { id: "es-ferias", language: 'es', name: "Vacaciones", tagline: "Flotador, cóctel y cero responsabilidades.", phrases: ["Hoy no ladro. Estoy de vacaciones.", "Más hielo, humano. Y menos preguntas.", "Sol, piscina y nadie me llama.", "¿Volver al trabajo? ¿Qué trabajo?", "¿Protector solar? Tengo pelo, humano."] },
  { id: "es-domingo", language: 'es', name: "Domingo", tagline: "Sofá, mando en la pata y ningún plan.", phrases: ["Domingo. El mando es mío. Y el sofá.", "¿Paseo? Están echando mi programa.", "Cambié de canal 40 veces. Agotado.", "Hoy solo me levanto para comer.", "El sofá y yo vamos en serio."] },
  { id: "es-vinho", language: 'es', name: "Hora del Vino", tagline: "Una copa, unas vistas y mucha clase.", phrases: ["Notas de atún. Excelente cosecha.", "Una copa después del baño. Me la gané.", "Brindo por el humano que me sirve.", "Bonitas vistas. Tapas pequeñas.", "Aprecio el vino. El queso, más."] },
  { id: "fr-diva", language: 'fr', name: "Diva", tagline: "Exige d’être admirée. Tu es son photographe perso.", phrases: ["C’est ma meilleure lumière. De rien.", "Mon meilleur profil ? Les deux.", "Des photos sans accord ? Vois mon agent.", "Éclaire-moi mieux, humain.", "Né pour ça. Toi, pour me servir."] },
  { id: "fr-esfomeado", language: 'fr', name: "Affamé", tagline: "A mangé il y a cinq minutes. Dépérit.", phrases: ["Mangé il y a cinq minutes. Je dépéris.", "Gamelle à moitié vide. J’ai failli mourir.", "Ce que tu manges est à moi. Partage.", "J’ai entendu le frigo. J’arrive.", "J’ai dîné ? Aucun souvenir. Ressers."] },
  { id: "fr-dramatico", language: 'fr', name: "Dramatique", tagline: "Chaque bain est une tragédie. Chaque non, une trahison.", phrases: ["Porte fermée. Je ne m’en remettrai pas.", "On m’a lavé. Que l’histoire s’en souvienne.", "Partie 5 minutes. J’ai vieilli de 10 ans.", "Dîner en retard. J’ai fait mon testament.", "Personne ne m’aime. Juste des croquettes."] },
  { id: "fr-vilao", language: 'fr', name: "Méchant", tagline: "Prépare la conquête de la maison. Commence par le verre.", phrases: ["Verre tombé de la table. Pour la science.", "Aujourd’hui le canapé. Demain, le monde.", "L’aspirateur en sait trop.", "Je souris : j’ai choisi le prochain verre.", "Le facteur est revenu. C’est personnel."] },
  { id: "fr-preguicoso", language: 'fr', name: "Paresseux", tagline: "Dormir n’est pas une habitude. C’est une carrière.", phrases: ["Réveillé pour manger. Je me rendors.", "Bouger ? Pas aujourd’hui. Demain, peut-être.", "Dormi douze heures. Besoin de repos.", "Le soleil a bougé. Quelle corvée.", "Je ne dors pas. J’économise mon énergie."] },
  { id: "fr-ciumento", language: 'fr', name: "Jaloux", tagline: "Le téléphone, l’autre animal et le bébé sont des ennemis.", phrases: ["Tu as regardé ton téléphone. J’ai tout vu.", "L’autre a eu des caresses. C’est la guerre.", "Cet ordi ne t’aime pas comme moi.", "Tu as caressé le chien du voisin. Traître.", "Moi ou le téléphone. Choisis bien."] },
  { id: "fr-caotico", language: 'fr', name: "Chaotique", tagline: "Courses folles à 3 h du matin. Le papier toilette n’a aucune chance.", phrases: ["Il est 3 h du matin. L’heure de courir.", "C’est pas moi. Enfin si, mais sans preuves.", "Le papier toilette m’a défié. Il a perdu.", "Tu as rangé la maison ? Dommage.", "J’ai couru partout. Aucune idée pourquoi."] },
  { id: "fr-critico", language: 'fr', name: "Critique", tagline: "Note la nourriture et le service. Jamais plus de deux étoiles.", phrases: ["Encore des croquettes ? Deux étoiles.", "Service lent. Pas de pourboire.", "Coussin froid. Une étoile.", "Le serveur regardait son téléphone.", "Belle assiette. Portion ridicule."] },
  { id: "fr-ferias", language: 'fr', name: "Vacances", tagline: "Bouée, cocktail et zéro responsabilité.", phrases: ["Pas d’aboiement : je suis en vacances.", "Plus de glaçons, humain. Moins de questions.", "Soleil, piscine et personne ne m’appelle.", "Reprendre le travail ? Quel travail ?", "De la crème solaire ? J’ai des poils."] },
  { id: "fr-domingo", language: 'fr', name: "Dimanche", tagline: "Canapé, télécommande sous la patte et zéro projet.", phrases: ["Dimanche. La télécommande est à moi.", "Promenade ? Mon émission commence.", "Changé de chaîne 40 fois. Épuisé.", "Aujourd’hui je me lève juste pour manger.", "Le canapé et moi, c’est sérieux."] },
  { id: "fr-vinho", language: 'fr', name: "L’Heure du Vin", tagline: "Un verre, une vue et beaucoup de classe.", phrases: ["Notes de thon. Excellent millésime.", "Un verre après le bain. Mérité.", "À la santé de l’humain qui me sert.", "Belle vue. Petites bouchées.", "J’apprécie le vin. Le fromage, plus."] },
];

/** Mirrors the `markets` column on the server. */
export function marketsOf(p: Personality): Market[] {
  if (p.language === 'pt-PT') return ['PT'];
  if (p.language === 'es') return ['ES'];
  if (p.language === 'fr') return ['FR'];
  return ['US', 'GB'];
}

export function personalitiesForMarket(market: Market): Personality[] {
  return personalities.filter((p) => marketsOf(p).includes(market));
}

export function personalitiesFor(language: AppLanguage): Personality[] {
  return personalities.filter((p) => p.language === language);
}

export function findPersonality(id: string | undefined): Personality | undefined {
  return id ? personalities.find((p) => p.id === id) : undefined;
}
