# PRD — Tradutor de Pensamentos de Animais

> Nome comercial: **PetBubble** (petbubble.app).
> Versão 1.0 · 10 de novembro de 2026

## 1. Resumo

O utilizador tira ou carrega uma foto do seu gato ou cão, escolhe uma personalidade e a app devolve **o seu animal transformado no estilo dessa personalidade** (ex.: pérolas e óculos de sol para a Tia de Cascais), com um balão de pensamento engraçado e sarcástico, pronta a partilhar no Instagram, TikTok ou WhatsApp. É uma app **paga desde a primeira foto**, com pacotes de créditos consumíveis.

## 2. O problema

- Quem tem animais tira dezenas de fotos por semana e gosta de as partilhar, mas uma foto "simples" já não chama a atenção.
- Criar um meme ou legenda engraçada sobre o próprio animal dá trabalho: é preciso ter a ideia, escrever a frase e editar a imagem.
- As apps de memes genéricas não são sobre o **meu** animal nem falam como os portugueses (ou americanos) falam.

**A app resolve:** conteúdo divertido, único e sobre o próprio animal, em segundos, sem esforço criativo.

## 3. Utilizador-alvo

| Segmento | Quem é | O que quer |
|---|---|---|
| **A — Criadores casuais** (principal) | 18–30 anos, publicam o animal no Instagram/TikTok | Conteúdo para stories e reels que tenha graça e se destaque |
| **B — Partilhadores de família** | Todas as idades, partilham sobretudo no WhatsApp | Fazer rir a família e os amigos com o animal |

**Mercados no lançamento:** Portugal (PT-PT) e EUA (EN).
**Mais tarde:** PT-BR, ES, FR e IT. A app fica preparada para estas línguas desde o primeiro dia.

## 4. Proposta de valor

- **É sobre o TEU animal:** é isso que dá valor emocional.
- **Fala como tu:** sotaques e personagens locais, não humor traduzido.
- **Pronta a partilhar:** um toque para enviar para o Instagram, TikTok ou WhatsApp.

## 5. Funcionalidades principais (v1)

### 5.1 Criar uma "tradução"
1. Tirar uma foto com a câmara ou escolher uma da galeria.
2. Escolher uma personalidade (6 por língua, ver 5.2).
3. Tocar em "Traduzir": a IA faz duas coisas:
   - **transforma a imagem** no estilo da personalidade (acessórios, roupa, cenário), mantendo o animal reconhecível;
   - **escreve uma frase** a partir da foto (expressão, pose, cenário).
4. A app desenha o balão de pensamento por cima da imagem transformada. O texto nunca é escrito pela IA dentro da imagem, porque sai muitas vezes com erros.
5. **1 nova frase grátis** por tradução: muda só o texto e mantém a imagem, por isso custa quase nada. Uma nova imagem gasta 1 crédito.
6. A geração demora 10–30 segundos: ecrã de espera com frases divertidas e a foto original em fundo.
7. Se a IA não detetar nenhum animal na foto, ou a geração falhar, o crédito **é devolvido** e o utilizador vê uma mensagem clara.

### 5.2 Feitios (os animais falam como animais)

O animal fala **como animal**, com lógica de gato ou de cão (tigela vazia, aspirador, carteiro, copos na mesa, corridas às 3 da manhã), e nunca como uma pessoa mascarada. Em vez de personagens humanas, há **8 feitios universais**, iguais em todas as línguas. A IA vê se a foto é de um gato ou de um cão e adapta a piada. Português neutro, sem calão regional.

| Feitio (PT / EN) | Atitude | Estilo visual |
|---|---|---|
| Diva / Diva | Exige ser admirado | Coroa, almofada de veludo, holofote |
| Esfomeado / Always Hungry | Comeu há 5 minutos, está a definhar | Guardanapo ao pescoço, rodeado de comida |
| Dramático / Dramatic | Cada banho é uma tragédia | Luz de cinema, lágrima, chuva na janela |
| Vilão / Villain | Planeia dominar a casa | Capa, covil escuro, luz vermelha |
| Preguiçoso / Lazy | Dormir é uma carreira | Pijama, manta, sofá |
| Ciumento / Jealous | O telemóvel e o outro animal são inimigos | Deitado no portátil, olhar desconfiado |
| Caótico / Chaos Gremlin | Corridas às 3 da manhã | Papel higiénico por todo o lado |
| Crítico / The Critic | Avalia comida e serviço | Boina, mesa de restaurante fino |

Frases: até **45 caracteres**, com um golpe seco no fim.

O animal tem de continuar reconhecível como **o mesmo animal** (raça, cor, padrões). A IA nunca pode dar ao animal a cara de uma pessoa real.

**Regra:** nunca usar nomes, fotos ou citações de pessoas reais (regra 5.2 da App Store e direito de imagem nos EUA).

As personalidades são **configuradas no servidor**, para podermos acrescentar ou afinar sem lançar uma nova versão.

#### Cenários (além do feitio)
Por defeito, a imagem usa o cenário do feitio. A pessoa pode escolher outro:

| Cenário | Custo | O que faz |
|---|---|---|
| Sorriso com dentes, Olhos arregalados, Óculos, Cabelo novo, Narigudo, Pose ridícula | 1 crédito | Fotos engraçadas, fundo pastel; só nestes a expressão pode ser exagerada |
| À medida | 2 créditos | A pessoa descreve o cenário (3–80 caracteres). A IA verifica e recusa pessoas reais, marcas, personagens com direitos, conteúdo sexual, violência, drogas, ódio ou maus-tratos a animais; se recusar, os 2 créditos são devolvidos |

Exemplos reais: `docs/screenshots/cenarios.jpg`.

### 5.3 Partilhar e guardar
- O balão fica longe da cara do animal (a IA indica onde está a cabeça) e as bolinhas param antes dela.
- Opção **"Sem balão"** (grátis): partilhar ou guardar só a imagem, com a marca de água.
- Folha de partilha nativa do iOS: Instagram, TikTok, WhatsApp, Mensagens, etc.
- Guardar no rolo da câmara.
- Formato da imagem final: o da foto original, com opção de recorte 9:16 para stories.
- A foto original fica guardada ao lado da transformada.
- **Sem marca de água**: todas as fotos são pagas.

### 5.4 Histórico
- Lista simples das traduções já feitas, para voltar a ver e a partilhar.
- Guardado na conta (sincroniza entre dispositivos a partir da Fase 2).

### 5.5 Créditos e pagamentos
Compras **consumíveis** através da Apple (StoreKit), com o paywall apresentado pelo Superwall.

| Pack | Preço | Preço por foto |
|---|---|---|
| 1 foto | 0,99 € | 0,99 € |
| 5 fotos | 3,99 € | 0,80 € |
| 10 fotos | 7,99 € | 0,80 € |
| 30 fotos | 19,99 € | 0,67 € |

- **Não há foto grátis.** A primeira foto já é paga.
- O saldo de créditos vive **só no servidor** (Postgres). A app nunca decide se há crédito.
- Cada compra é validada no servidor junto da Apple. Cada transação só pode dar créditos uma vez.
- Reembolsos feitos pela Apple retiram os créditos correspondentes.
- Botão **"Restaurar compras"**, que volta a sincronizar o saldo com o servidor.

### 5.6 Conta
- **"Iniciar sessão com a Apple"** é o único login. Só é pedido na primeira compra.
- **Apagar conta** dentro da app: apaga os dados, as fotos e revoga o token da Apple.
- Política de privacidade e termos acessíveis dentro da app e na página da App Store.

### 5.7 Proteções (não negociáveis)
- Chaves secretas (IA, service role do Supabase) **só em Edge Functions**, nunca dentro da app.
- **Nenhuma geração sem crédito validado no servidor.** O crédito é descontado de forma atómica antes da chamada à IA e devolvido se a geração falhar.
- **Rate limiting por utilizador**, por exemplo: máximo 5 gerações por minuto e 100 por dia.
- Row Level Security em **todas** as tabelas.

## 6. O que fica de fora da v1

- PT-BR, ES, FR e IT (a estrutura fica pronta, as traduções vêm depois).
- Escolher vários estilos visuais para a mesma personalidade.
- Vídeo ou fotos animadas.
- Subscrições.
- Outros logins (Google, email).
- Android.
- Feed social, gostos e perfis públicos.
- Personalidades criadas pelo utilizador.
- Animais que não sejam cães ou gatos (a IA tenta, mas o tom não é afinado para eles).
- Notificações push.

## 7. Fluxo do utilizador (do primeiro ecrã ao paywall)

```
[1] Abrir a app pela primeira vez
      │
[2] Onboarding (3 ecrãs)
      ├─ "O teu animal tem muito para dizer" — o que a app faz
      ├─ Galeria de exemplos com várias personalidades (sem custo de IA)
      └─ "Começar"
      │
[3] Ecrã principal — "Traduz o teu bicho"
      ├─ Tirar foto  → pedido de permissão da câmara (com justificação)
      └─ Escolher da galeria → pedido de permissão das fotos (com justificação)
      │
[4] Pré-visualização da foto + escolher personalidade
      │
[5] Tocar em "Traduzir"
      │
      ├─ Tem créditos? ── Sim ──► [8] Geração
      │
      └─ Não
           │
[6] PAYWALL (Superwall): 4 packs, "Restaurar compras", termos e privacidade
      │  o utilizador escolhe um pack
      │
[7] Sem sessão iniciada? → "Iniciar sessão com a Apple"
      │  ("para guardar os teus créditos em segurança")
      │  → compra na Apple → servidor valida → créditos adicionados
      │
[8] Geração (10–30 s): imagem transformada + frase, com ecrã de espera
      │
[9] Resultado: foto + balão
      ├─ Partilhar  (Instagram / TikTok / WhatsApp / …)
      ├─ Guardar no rolo
      ├─ Nova frase (grátis, 1 vez) · Nova imagem (1 crédito)
      └─ Nova foto → [3]
```

Quem já tem créditos salta diretamente de [5] para [8]. O paywall volta a aparecer sempre que o saldo chega a zero.

## 8. Como vamos medir

### Métrica principal (ao fim de 30 dias na App Store)
**Conversão ≥ 5%**: percentagem de utilizadores que abrem a app e compram pelo menos um pack.

### Métricas secundárias
| Métrica | Objetivo inicial |
|---|---|
| Recompra (quem comprou e voltou a comprar) | ≥ 20% |
| Partilha (gerações que são partilhadas) | ≥ 40% |
| Onboarding concluído | ≥ 80% |
| Paywall visto → compra | ≥ 15% |
| Gerações falhadas (erro técnico) | < 2% |
| Custo de IA por geração (imagem + frase) | < 0,15 € |
| Tempo de geração (mediana) | < 20 s |
| Gerações reconhecidas como "o meu animal" (inquérito/feedback) | ≥ 90% |

### Eventos do funil (PostHog)
| Evento | Propriedades |
|---|---|
| `app_opened` | `first_open` |
| `onboarding_completed` | — |
| `photo_selected` | `source` (câmara/galeria) |
| `personality_selected` | `personality_id`, `locale` |
| `paywall_viewed` | `trigger` |
| `sign_in_completed` | — |
| `pack_purchased` | `pack_id`, `price`, `currency` |
| `photo_generated` | `personality_id`, `is_retry`, `credits_left`, `duration_ms` |
| `photo_shared` | `destination` (quando o iOS o indica) |
| `photo_saved` | — |
| `generation_failed` | `reason` |

Não enviamos fotos nem dados pessoais para o PostHog.

## 9. Requisitos da Apple (para não sermos rejeitados)

- [ ] "Iniciar sessão com a Apple" (único login)
- [ ] Apagar conta dentro da app, com revogação do token da Apple
- [ ] Política de privacidade e termos, na app e na App Store
- [ ] Botão "Restaurar compras" no paywall e nas definições
- [ ] Nenhum texto "em breve" nem funcionalidades a meio
- [ ] Justificação clara das permissões da câmara e das fotos, em PT-PT e EN
- [ ] Sem nomes ou imagens de pessoas reais
- [ ] Compras dentro da app só através da Apple
- [ ] Etiquetas de privacidade da App Store preenchidas corretamente

## 10. Privacidade

- As fotos são guardadas no Supabase Storage em pastas privadas por utilizador, com RLS.
- A foto é enviada aos fornecedores de IA só para gerar a imagem e a frase, sem ser usada para treino (a confirmar nos termos do fornecedor).
- Apagar a conta apaga todas as fotos e dados.
- RGPD: os dados ficam na UE (região do Supabase em Frankfurt ou Irlanda).

## 11. Decisões de stack

| Área | Escolha |
|---|---|
| App | Expo (React Native) + Expo Router + TypeScript, iOS primeiro |
| Backend | Supabase: Postgres com RLS, Auth, Storage, Edge Functions |
| Login | Iniciar sessão com a Apple |
| Pagamentos | Superwall (paywall) + StoreKit (consumíveis) + validação própria numa Edge Function (App Store Server API + notificações de reembolso) |
| IA | Dois modelos, chamados só a partir de Edge Functions: um de **edição de imagem** (transforma a foto no estilo da personalidade) e um de **texto com visão** (escreve a frase) |
| Analytics | PostHog |
| Erros | Sentry |
| Emails | Resend, a partir de Edge Functions (ex.: confirmação de conta apagada) |
| Publicação | EAS Build (compila na cloud, sem Mac) → EAS Submit → TestFlight → App Store, correções com EAS Update |
| Testes | Testes automáticos na versão web (Playwright) + testes manuais no iPhone (Expo Go na Fase 1, builds de teste do EAS a partir da Fase 3) |

**Nota sobre os consumíveis:** o Superwall trata bem do paywall e da compra, mas **não guarda saldos de créditos**. Por isso o saldo e a validação ficam no nosso servidor: a app envia a transação assinada da Apple para uma Edge Function, que a verifica e adiciona os créditos. A alternativa seria o RevenueCat, que também valida consumíveis, mas acrescentaria mais uma ferramenta sem resolver o saldo. Mantemos o Superwall.

## 12. Perguntas em aberto

- Nome comercial e ícone da app.
- Fornecedores e modelos de IA finais (imagem e texto): escolhemos na Fase 2, com testes de qualidade, fidelidade ao animal, tempo e custo nas 12 personalidades.
- Texto exato da política de privacidade e dos termos (Fase 3).
