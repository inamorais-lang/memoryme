import type { AppLanguage } from '@/i18n';

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
export const personalities: Personality[] = [
  // ——— PT-PT: sotaques e tipos portugueses ———
  {
    id: 'pt-nortenho',
    language: 'pt-PT',
    name: 'Nortenho',
    tagline: 'Fala alto, chama-te "ó meu" e acha que no Norte é tudo melhor.',
    phrases: [
      'Ó carago, outra vez com o telemóvel na minha cara? Pagas-me direitos de imagem ou quê?',
      'Isto não é ração, é uma ofensa. A minha avó em Gaia fazia melhor de olhos fechados.',
      'Uma francesinha e uma sesta ao sol. Peço pouco, pá.',
      'Estás a olhar para mim porquê? Queres alguma coisa, ó meu?',
      'Não estou deitado no sofá. Estou a guardar o lugar, que isto vai encher.',
      'Se me chamas "fofinho" outra vez à frente das visitas, mudo-me para Matosinhos.',
      'Aqui manda quem chegou primeiro. E cheguei eu, carago.',
      'Os de Lisboa a dizer que isto é frio… Isto é fresquinho, pá!',
      'Abre-me essa lata, que eu não tenho o dia todo. Tenho, mas não interessa.',
      'Dormir catorze horas por dia é trabalho, ouviste? Trabalho!',
    ],
  },
  {
    id: 'pt-alentejano',
    language: 'pt-PT',
    name: 'Alentejano',
    tagline: 'Sem pressa nenhuma. Amanhã também é dia.',
    phrases: [
      'Tira lá a foto com calma, que eu também não vou a lado nenhum.',
      'Comer agora? Antes da sesta? Isso é coisa de gente de Lisboa.',
      'Atão e a pressa, compadre? A pressa é inimiga da sesta.',
      'Estive a pensar desde manhã… e depois esqueci-me em quê. Fica pra amanhã.',
      'Correr atrás da bola? Atira-a tu, que tens mais pernas pra isso.',
      'Se o sol se mexer, eu mexo-me atrás dele. É o meu exercício.',
      'Isto não é preguiça, é estar quieto com convicção.',
      'Já fiz o meu dia todo: acordei. Agora descanso do esforço.',
      'Ó moço, essa luz da câmara dá-me um trabalhão a abrir os olhos.',
      'Quem dorme não peca. E eu sou um santinho.',
    ],
  },
  {
    id: 'pt-tia-cascais',
    language: 'pt-PT',
    name: 'Tia de Cascais',
    tagline: 'Diz "tipo" a cada frase e acha a ração "muito básica".',
    phrases: [
      'Querida, esta almofada é tipo… do IKEA? Não consigo.',
      'Esta ração é muito… básica. Não há assim uma coisa mais biológica?',
      'Ai, não me fotografes deste lado, que é o meu lado menos Comporta.',
      'Já disse que só bebo água com gás. Com limão. Cortado fino.',
      'Passear no parque? Com esta gente toda? Ai, não, filha, vamos antes ao Guincho.',
      'Tipo, eu nem sou snob. Só tenho padrões, percebes?',
      'O meu pedigree tem mais apelidos do que a tua família toda junta.',
      'Fofinha, se não é linho, eu não me deito.',
      'Este verão fazemos Comporta, depois Melides. Lisboa em agosto é para os outros.',
      'O gato do vizinho mia com sotaque. Não tenho nada contra, atenção.',
    ],
  },
  {
    id: 'pt-novela',
    language: 'pt-PT',
    name: 'Dramático de novela',
    tagline: 'Cada jantar atrasado é uma traição digna de horário nobre.',
    phrases: [
      'Cinco minutos atrasada com o jantar. Cinco! Nunca te vou perdoar, Maria Helena!',
      'Saíste de casa sem me dizer adeus. Fica sabendo que eu morri um bocadinho.',
      'Este prato vazio é o símbolo do nosso amor. Acabou-se tudo.',
      'Não me toques! … Está bem, toca. Mas só atrás da orelha.',
      'Tu tens outro animal. Sinto o cheiro na tua roupa. Não mintas!',
      'No próximo episódio: será que ela me dá o resto do frango?',
      'Dei-te os melhores anos da minha vida. E tu deste-me ração de marca branca.',
      'Vou ficar aqui à janela, a olhar para a chuva, a pensar no que podíamos ter sido.',
      'Fecharam-me a porta da cozinha. A mim. Depois de tudo o que passámos.',
      'Tirem-me esta coleira, que eu nasci para ser livre! … Mas só depois do lanche.',
    ],
  },
  {
    id: 'pt-preguicoso',
    language: 'pt-PT',
    name: 'Preguiçoso',
    tagline: 'Já está cansado só de ler isto.',
    phrases: [
      'Acordei só para te dizer que vou voltar a dormir.',
      'Hoje tenho a agenda cheia: sofá, cama, sofá.',
      'Pestanejar conta como exercício, certo?',
      'Se a comida viesse ter comigo, era o animal mais feliz do mundo.',
      'Não me chames. Eu ouvi. Só não me apetece.',
      'Estou a fazer uma pausa. Da pausa anterior.',
      'Domingo é o meu dia preferido. Segunda também. E terça…',
      'Este é o meu lado bom. O outro também está a dormir.',
      'Dá-me cinco minutos. Ou cinco horas. Logo se vê.',
      'Abanar a cauda? Hoje não. Fica a intenção.',
    ],
  },
  {
    id: 'pt-avo',
    language: 'pt-PT',
    name: 'Avó portuguesa',
    tagline: 'Acha que estás magro, que apanhas frio e que já devias ter casado.',
    phrases: [
      'Estás tão magrinho, filho. Come mais um bocadinho, nem que seja da minha tigela.',
      'Vai vestir um casaco, que eu daqui estou a ver que tens frio.',
      'Então e namorada, nada? Olha que eu não duro sempre.',
      'No meu tempo não havia brinquedos. Brincávamos com uma meia e éramos felizes.',
      'Já ligaste à tua mãe hoje? Liga, que ela fica preocupada.',
      'Sopa. Antes de tudo, sopa. Depois logo se fala.',
      'Ai, que essa câmara ainda te dá cabo dos olhos.',
      'Guardei-te um bocadinho de presunto. Não digas a ninguém.',
      'Dormir no chão faz mal aos rins. Anda para a manta.',
      'Ó menino, já viste as horas? Isto são horas de andar acordado?',
    ],
  },

  // ——— EN: American archetypes (no real people) ———
  {
    id: 'en-tech-billionaire',
    language: 'en',
    name: 'The Tech Billionaire',
    tagline: 'Disrupting the food bowl industry. Posts at 3am.',
    phrases: [
      "I'm not napping. I'm running a stealth-mode startup in my head.",
      "This food bowl is legacy infrastructure. We're moving to a subscription model.",
      'Just bought the couch. Firing half of the cushions.',
      "In five years every pet will live on Mars. I'll go first. After my nap.",
      'Posting this at 3am because sleep is for people without a vision.',
      "The laser pointer is the future. I've been saying this for years.",
      'We need to talk about the treat-to-human ratio. It is unacceptable.',
      "I don't chase the ball. I acquire it.",
      'My bed is now open source. Nobody else is allowed on it, though.',
      'Day one of my new company: Nap Inc. Valuation: infinite.',
    ],
  },
  {
    id: 'en-campaign-rally',
    language: 'en',
    name: 'The Campaign Rally',
    tagline: "Everything is tremendous. Nobody's ever seen a snack like this.",
    phrases: [
      'This is the best nap. Tremendous nap. Many people are saying it.',
      "We're going to build a fence. And the dog next door is going to pay for it.",
      'Nobody knows more about treats than me. Nobody.',
      "My food bowl? Huge. The biggest. Everybody's jealous.",
      'Fake news. I did not knock that glass off the table.',
      "We're going to make dinnertime great again. And earlier.",
      'The vacuum cleaner is a total disaster. Sad!',
      "I have the best fur. People come up to me, crying, saying 'sir, your fur…'",
      'The couch is mine. We won the couch. Bigly.',
      'Believe me, this belly rub will be the greatest in history.',
    ],
  },
  {
    id: 'en-influencer',
    language: 'en',
    name: 'The Influencer',
    tagline: 'Lives for the algorithm. Every nap is content.',
    phrases: [
      "Wait, don't post yet. Get my good side. No, my OTHER good side.",
      'Morning routine: wake up, stretch, ignore my emails, post.',
      'This sunbeam is giving main character energy.',
      'Not me pretending this was spontaneous. Took 47 tries.',
      'Use code NAPQUEEN for 10% off my lifestyle.',
      "Living my best life. Also, where's my dinner? Asking for a friend.",
      'Hydrated. Moisturized. Unbothered. Shedding on your black jeans.',
      "If it's not on my story, did I even sleep?",
      'Link in bio for my exclusive belly rub masterclass.',
      'Brand deal pending with the treat company. Act natural.',
    ],
  },
  {
    id: 'en-wall-street',
    language: 'en',
    name: 'The Wall Street Bro',
    tagline: 'Treats are an asset class. Naps are a hedge.',
    phrases: [
      "I'm long on treats and short on patience.",
      'Just closed a deal: one sock for two belly rubs. Huge margins.',
      "Sleep? I'll sleep when the market closes. Oh, it closed. Goodnight.",
      'My portfolio is 80% tennis balls. Diversified, baby.',
      'Bro, do you even lift? Because I need you to lift me onto the couch.',
      'This dip in the food bowl is a buying opportunity.',
      "I don't do walks. I do power walks. To the fridge.",
      'Bullish on dinner. Bearish on baths.',
      "Let's circle back on the vet appointment. Like, never.",
      "Synergy is when you drop food and I'm already there.",
    ],
  },
  {
    id: 'en-southern-grandma',
    language: 'en',
    name: 'The Southern Grandma',
    tagline: 'Bless your heart. Now eat something.',
    phrases: [
      'Bless your heart, you call that a treat?',
      "Honey, you're skin and bones. Fix yourself a plate. Fix me one too.",
      "I've been sittin' on this porch since sunrise and I ain't movin' for nobody.",
      "Don't you take that tone with me. I raised six litters.",
      "Sweet tea, a warm blanket and a nap. That's the whole recipe, sugar.",
      "Well, I'll be. You finally remembered to feed me.",
      'Mind your manners and scratch behind my ears.',
      'In my day we chased real mice, not that red dot nonsense.',
      "Y'all better come in before it rains. I'm stayin' right here, though.",
      "That vacuum cleaner is the devil, and I'll hear nothing otherwise.",
    ],
  },
  {
    id: 'en-drama-queen',
    language: 'en',
    name: 'The Drama Queen',
    tagline: 'Every late dinner is a betrayal of Shakespearean scale.',
    phrases: [
      'You left for FIVE minutes. I aged a decade.',
      'Dinner is late. I have written my will. You are not in it.',
      "Don't look at me. I'm not ready for my close-up. Okay, now.",
      'This is the worst day of my life. Again.',
      "You petted the other one first. I'll remember this until my ninth life.",
      "Fine. I'll just starve. Dramatically. On the good rug.",
      'The bowl is half empty. Just like my soul.',
      "I'm not crying. It's just the tragedy of an empty treat jar.",
      "On tonight's episode: will they finally share the chicken?",
      'Close the curtains. I need to be alone. Come back in two minutes.',
    ],
  },
];

export function personalitiesFor(language: AppLanguage): Personality[] {
  return personalities.filter((p) => p.language === language);
}

export function findPersonality(id: string): Personality | undefined {
  return personalities.find((p) => p.id === id);
}
