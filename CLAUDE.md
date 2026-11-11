# CLAUDE.md

App iOS que "traduz" o pensamento de um gato ou cão: foto + personalidade → foto com balão de pensamento sarcástico.

- Produto: `docs/PRD.md`
- Fases: `docs/ROADMAP.md`
- Estado atual: **Fase 2 quase concluída**. Servidor no Supabase real (zuwfxzgbxhdpnmkyjdad), IA a funcionar, app testada no iPhone pela Expo Go. Ficam para a Fase 3: compras (tabela `purchases`) e revogar o token da Apple ao apagar a conta.

## Regras não negociáveis
- Chaves secretas (IA, service role do Supabase) **só** em Supabase Edge Functions. Nunca no código da app nem em variáveis `EXPO_PUBLIC_*`.
- Nenhuma geração de IA sem crédito validado e descontado no servidor, com rate limiting por utilizador.
- RLS em todas as tabelas.
- Todo o texto visível vem do i18n (`pt-PT` é a língua de referência, `en` é a segunda). Nada de texto escrito diretamente nos componentes.
- Cores, tipografia e espaçamentos só a partir do design system. Nada de valores soltos nos ecrãs.
- Sem nomes, fotos ou citações de pessoas reais nas personalidades.
- Nada de "em breve" na app.
- Antes de cada fase: plano curto, aprovado pelo dono do produto.
- **Perguntar sempre antes de decidir** qualquer mudança de produto ou design.
- Um commit por mudança que funcione, com mensagem clara.

## Decisões
| Decisão | Motivo |
|---|---|
| A IA transforma a imagem no estilo da personalidade **e** escreve a frase; o balão é sempre desenhado pela app | Pedido do dono do produto (opção B). A IA escreve mal texto dentro de imagens. Custo alvo < 0,15 €/geração |
| Sem foto grátis; packs consumíveis de 0,99 € / 3,99 € / 7,99 € / 19,99 € (1/5/10/30) | Evita abuso e custos de IA sem receita |
| 1 nova **frase** grátis por tradução (a imagem mantém-se); nova imagem gasta 1 crédito | A imagem é cara; a frase é quase grátis |
| Login com a Apple só na primeira compra | Menos fricção no início |
| Saldo de créditos só no servidor; validação própria das transações da Apple | O Superwall não guarda saldos de consumíveis |
| Personalidades configuradas no servidor (a partir da Fase 2) | Afinar sem lançar uma nova versão |
| Ecrã de escolha: no topo Natal (7, `category = 'natal'`; esconder em janeiro com `active = false`), depois Cenários (Dia de praia, Snowboard, "Criar cenário" 3–80 caracteres a 2 créditos) e por fim os 11 Modos; escolhe-se **um** destes. Cenários (`scenes.kind = 'place'`) têm tom de frase próprio (`voice_prompt`). Depois de escolher aparece o "Toque engraçado" opcional e grátis (`kind = 'comic'`: sorriso com dentes, olhos arregalados, óculos, cabelo novo, narigudo, pose ridícula; `addon_prompt` junta-se ao estilo; expressão exagerada só com ele) | Pedido do dono do produto; o criar cenário custa mais e é verificado pela IA |
| Sem modo "Exagerado" (testado e retirado: pilhas de objetos confusas). Em vez disso, todas as imagens têm cara mais cómica (natural para a espécie), 2–3 dos objetos da própria cena e cores vivas | Decisão do dono do produto |
| Idade mínima 16 anos (consentimento RGPD para a IA sem pais em PT, ES, FR, Reino Unido; acima dos 13 dos EUA) | Decisão do dono do produto |
| 5 línguas: PT-PT, ES, FR, EN-GB, EN-US (os dois ingleses só diferem na ortografia); Termos e Privacidade nas 4 línguas | Pedido do dono do produto |
| Na app, "Feitio" chama-se **Modo** (pedido do dono do produto) | "Feitio" não soava bem; "Cenário" já é a 2.ª escolha |
| Os animais falam como animais: 11 modos universais (PT/EN; no código e na BD chamam-se `personalities`), lógica de gato/cão, português neutro; personagens humanas inativas | Decisão do dono do produto: as piadas humanizadas não tinham graça |
| Sem Mac: EAS Build na cloud + Expo Go/builds de teste no iPhone; testes automáticos na web | O dono do produto só tem iPhone |
| Só modo claro na v1 | Identidade visual única; menos trabalho de design |
| App em `mobile/`, site antigo na raiz | Não misturar com o site existente |
| Design limpo e minimalista, cores vivas da moda (rosa choque, verde-lima, lilás); todos os botões com cor (primary/secondary/tertiary, sem botões só de texto); sem contornos, sombras suaves | Pedido do dono do produto: app jovem, com humor |
| Nome da app: **PetBubble** (petbubble.app) | Curto, funciona em PT e EN, liga ao balão |
| Logo: balão de pensamento rosa (#FF3D81) com pata branca e rasto de 2 bolinhas, fundo verde-lima (#C8F53A); ecrã de arranque verde-lima com o balão (`assets/images/*`, gerados por script a partir de SVG) | Escolha do dono do produto (proposta B) |
| Fontes: Bricolage Grotesque (títulos e balão) + DM Sans (texto) | Moderna e irreverente, não parecer "feito por IA" |
| Ordem: confirmar que há animal (Claude, barato) → imagem (fal) → frase escrita a olhar para a imagem final | Foto sem animal nunca chega ao modelo caro; a frase bate certo com o que está na imagem |
| Imagem por fal.ai com modelo configurável | Uma só chave para comparar modelos; trocar sem nova versão |
| Login com a Apple testável na Expo Go (client ID `host.exp.Exponent`) | Conta Apple Developer só é precisa na Fase 3 |

## Comandos
Tudo dentro de `mobile/`:

```bash
npm start            # servidor de desenvolvimento (Expo Go no iPhone)
npm run web          # versão web, para testes automáticos
npm run check        # tipos + lint + testes — correr antes de cada commit
npm test             # só os testes unitários (Jest)
```

- Instalar pacotes nativos com `npx expo install <pacote>`. Sem rede para api.expo.dev, usar `EXPO_OFFLINE=1 npx expo install <pacote>`.
- **Sem Mac:** não há Xcode nem simulador. Teste automático = versão web com Playwright em tamanho de iPhone. Teste manual = Expo Go no iPhone (Fases 1–2), builds EAS (Fase 3+).
- Se o servidor web não refletir alterações, reiniciar com `npx expo start --web -c`.
- **Testar no iPhone (Expo Go):** projeto Expo `@inamoraiss-team/petbubble`; a chave da Expo é injetada pelo proxy (`EXPO_TOKEN=proxy-injected`). Publicar com:
  ```bash
  cd mobile && set -a && . ./.env && set +a && EXPO_TOKEN=proxy-injected npx eas-cli@latest update --branch preview --environment preview --platform ios --message "..." --non-interactive
  ```
  O `.env` tem de ser carregado à mão (com `--environment` o EAS não o lê). `runtimeVersion` = `sdkVersion` (a Expo Go só abre `exposdk:58.0.0`). Link: `exp://u.expo.dev/<projectId>/group/<update group id>`; na Expo Go, entrar com a conta do dono.

## Servidor (Supabase)
```
supabase/
  migrations/                 esquema + RLS + funções de créditos; personalidades e prompts
  functions/generate          um modo, um cenário ou um cenário criado (+ toque engraçado grátis); gasta 1 crédito, ou 2 com cenário criado (SQL atómico) → 202; em segundo plano: Claude ("há animal?") → recorte das barras/margens se a foto for uma captura de ecrã (`crop.ts`, jpeg-js) → [à medida: Claude verifica e descreve o cenário] → fal (imagem) → Storage → Claude (frase sobre a imagem final)
  functions/new-phrase        a frase grátis (1 por geração), sem gastar crédito
  functions/delete-account    apaga fotos + utilizador (linhas apagadas em cascata)
  functions/delete-image      apaga uma imagem do utilizador (ficheiro + linha); não apaga as que estão a ser criadas
  functions/verify-purchase   compra StoreKit 2 (JWS da Apple, verificado até à Apple Root CA G3) → confere app, consumível e appAccountToken = id do utilizador → grant_purchase (uma vez por transação)
  functions/apple-notifications  notificações da App Store (V2, assinadas): REFUND/REVOKE → revoke_purchase (retira créditos, nunca abaixo de 0). Sem login
  functions/cleanup-originals  de hora a hora (pg_cron): apaga fotos originais com mais de 23 h (RGPD: máx. 24 h). Sem chave: só apaga, nunca devolve dados
  functions/_shared           ai.ts (Claude, fal), pipeline.ts (lógica testável), store.ts, prompts.ts
  tests/                      testes SQL (Postgres simples) — `supabase/tests/run.sh`
```

- Compras: `credit_packs` (app.petbubble.credits.1/5/10/30 → 1/5/10/30 créditos, configurável no servidor) e `purchases` (fica após apagar a conta, sem ligação à pessoa: registo fiscal). Bundle ID `app.petbubble`.
- Créditos: só as funções SQL `start_generation`, `fail_generation`, `grant_credits`… mexem em saldos, e só o `service_role` as pode chamar. A app só lê.
- Falhas devolvem sempre o crédito (`fail_generation` é idempotente). Gerações presas >5 min expiram e são reembolsadas.
- Limites: 5/min, 100/dia, 2 em curso por utilizador (`private.limits()`).
- Segredos (Edge Function secrets): `ANTHROPIC_API_KEY`, `FAL_KEY`; opcionais `TEXT_MODEL` (padrão `claude-opus-5-5`), `IMAGE_MODEL` (padrão `fal-ai/flux-pro/kontext`, escolhido por comparação: animal grande e fiel, 0,04 $, ~9 s).
- A app fica em **modo local** (Fase 1, sem servidor) se `mobile/.env` não tiver `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### Comandos do servidor
```bash
supabase/tests/run.sh                      # migrações + testes SQL (precisa de PGHOST/PGPORT de um Postgres local)
deno test supabase/functions/_shared       # testes do pipeline (IA falsa)
deno check supabase/functions/*/index.ts   # tipos das Edge Functions
npx supabase@2 ...                         # CLI fixada na v2 (a v3 mudou comportamentos)
```
- O Deno recusa pacotes npm com menos de 24 h: fixar versões publicadas há pelo menos um dia.

## Arquitetura da app
```
mobile/
  app.json                     nome, permissões (PT), plugins, idiomas iOS
  locales/ios/*.json           textos das permissões por idioma
  src/
    app/                       ecrãs (Expo Router): index → personality (Natal / cenário / modo + toque engraçado) → (sign-in | no-credits) → result; history; settings
    design/                    design system: tokens.ts + AppText, Button, Screen
    i18n/                      i18next; locales/pt-PT.ts é a referência, en.ts igual em chaves
    features/
      personalities/data.ts    11 modos por língua (espelho do servidor; frases só para modo local)
      backend/                 ÚNICA porta para dados: local.ts (Fase 1) ou remote.ts (Supabase); os ecrãs só usam `backend`
      auth/AuthContext.tsx     sessão, login com a Apple, créditos, terminar sessão, apagar conta
      translate/translate.ts   frases locais (só modo local)
      history/history.ts       histórico guardado no dispositivo
      draft/DraftContext.tsx   foto + escolha (modo | cenário | criar cenário) + toque engraçado, antes de criar a imagem
    components/                ThoughtBalloon, TranslationCanvas (vista exportada como PNG)
    lib/                       fotos (câmara/galeria), exportar/partilhar/guardar, kv (SQLite | localStorage)
```

- Balão: 68% da largura, arrastável (`balloon_x/y` em frações 0..1), "Mover balão" percorre os 4 cantos. Ao escrever a frase, a IA devolve a caixa da cabeça (`generations.head`, x/y/w/h 0..1); e do objeto principal da cena (`generations.prop`, ex.: comando, copo); sem posição escolhida, a app põe o balão no canto que menos tapa a cabeça e, depois, o objeto (`components/balloonLayout.ts`). Nunca tapa a marca de água.
- "Sem balão · grátis" no resultado: esconde o balão e partilha/guarda só a imagem (com marca de água).
- Regras globais de imagem (`imageEditPrompt`): **nunca exemplos concretos de objetos** — o modelo copia-os para todas as cenas (ex.: "três hambúrgueres" apareceu na praia e no Natal; "confetti" em todo o lado).
- Mudar a pose do animal (ex.: de barriga para cima) só resulta com a pose **no início** do prompt do cenário ("Change the pose: …").
- Fidelidade: o "há animal?" devolve também `appearance` (vai no início do prompt; manchas pequenas são "pelo, não sujidade"; mesmo assim o FLUX Kontext apaga manchas muito pequenas, ex.: a do lábio do gato) (cores e marcas, com o sítio de cada uma), que entra no prompt da imagem como obrigatória ("reproduz todas, no mesmo sítio, não acrescentes nenhuma"). Sem isto o modelo às vezes apagava marcas pequenas (ex.: risca branca no focinho).
- Expressão por espécie: gatos mostram atitude com olhos/orelhas/postura, boca fechada ou entreaberta, nunca sorriso de dentes (ficavam com "focinho de cão"); cães podem sorrir de boca aberta.
- Sem mãos humanas: se o animal segura ou toca em algo, usa as próprias patas (regra global em `imageEditPrompt`).
- Autorização da IA (Apple 5.1.2(i) + RGPD): ecrã `ai-consent` antes da 1.ª imagem (guardado no dispositivo, `features/consent`); `generate` exige `aiConsent: true` e grava `profiles.ai_consent_at`; retirar nas Definições.
- Termos e Privacidade: `docs/legal` (PT/EN/ES/FR, Ana Abreu, petbubble.ai@icloud.com; arbitragem individual + renúncia a ações coletivas nos EUA, exclusão de garantias, limite de responsabilidade, indemnização; secções CCPA, BIPA (sem biometria), COPPA; retenção real de cada fornecedor conforme os DPA; aceitação + 16 anos confirmados no ecrã de login), publicados no GitHub Pages; a app abre-os (`LegalLinks`, `legalUrl` em `src/config.ts`) nas Definições, no login e no ecrã da autorização. Lista da Apple: `docs/APPLE_CHECKLIST.md`.
- Fotos originais: apagadas pelo pipeline assim que a imagem fica pronta (ou falha) e, por segurança, pela limpeza de hora a hora (máx. 24 h). As imagens criadas ficam até a pessoa apagar a conta.
- Recorte: o "há animal?" devolve também onde está a fotografia dentro da imagem; se houver barras ou margens (capturas de ecrã), o servidor corta só isso — o conteúdo da foto nunca é cortado (pedido do dono do produto). Se o recorte falhar, usa a original. Fotos que já trazem a nossa marca de água (capturas da app) não são cortadas: o modelo copia a marca, e o dono do produto aceitou deixar assim.
- Frases da IA: lógica de animal, inspiradas no que os donos dizem dos bichos; a IA descarta a primeira ideia (óbvia). Máx. **45** caracteres (`PHRASE_MAX`), golpe seco no fim, nunca descrever a roupa/cenário. A IA dá 3 opções e o servidor escolhe a primeira que cabe; se nenhuma couber, pede outra vez uma vez.
- Cenários (`scenes`, no servidor, prompts escondidos): escolhidos em vez de um modo (`generations.personality_id` fica vazio; `language` guarda a língua do cenário criado). Apps antigas que enviam um engraçado como `sceneId` continuam a funcionar (passa a toque). Criar cenário: recusado (pessoas reais, marcas, impróprio…) → `scene_rejected`, 2 créditos devolvidos. No modo local não há cenários.
- Frase própria: "Escrever a minha frase", máx. **45** caracteres (`CUSTOM_PHRASE_MAX` e `check` na BD), grátis, sem IA; `custom_phrase` substitui a frase da IA no balão.
- Balão: rasto de 3 bolinhas desenhado na foto, a apontar para a cabeça e a parar antes dela (encolhem ou desaparecem se não houver espaço); cor pastel (`colors.balloonTints`) estável por tradução (`tintFor(id)`), tocar no balão troca a cor.
- Marca de água fixa em todas as imagens (canto inferior direito, pequena): "Feito com IA · PetBubble" (AI Act da UE + publicidade). Não se pode remover. Só não aparece no ecrã de espera, que mostra a foto original.
- Ao partilhar, vai também um texto com o link da App Store (`APP_STORE_URL` em `src/config.ts`, vazio até à Fase 3; enquanto vazio, só a imagem). A marca de água fica "Feito com IA · PetBubble" (pedido do dono do produto: link da App Store, não domínio).
- A imagem partilhada é a captura de `TranslationCanvas` (`react-native-view-shot`): foto original + balão desenhado pela app.
- Ficheiros `*.web.ts` substituem os nativos na web (ex.: `kv.web.ts`).
- Palavra para o animal: PT "patudo" (nunca "bicho"), ES "mascota", FR "compagnon", EN "pet" (pedido do dono do produto). Os textos legais ficam neutros ("animal").
- Línguas: `pt*` → PT-PT, `es*` → espanhol (Espanha), `fr*` → francês (França), `en` com país ≠ EUA → inglês britânico, tudo o resto → inglês dos EUA (`locales/en-US.ts` só muda a ortografia, ex.: color). Conteúdo (modos/cenários/frases) por língua: `pt-PT`, `en` (partilhado GB/US; a frase segue `generations.spelling`), `es`, `fr`; mercados PT, ES, FR, GB, US. Natal adaptado: Nochebuena e Mañana de Reyes (ES), Réveillon com bûche (FR).
