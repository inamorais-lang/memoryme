# CLAUDE.md

App iOS que "traduz" o pensamento de um gato ou cão: foto + personalidade → foto com balão de pensamento sarcástico.

- Produto: `docs/PRD.md`
- Fases: `docs/ROADMAP.md`
- Estado atual: **Fase 2 em curso**. Código do servidor e da app feito e testado localmente; falta ligar ao projeto Supabase real (contas e chaves do dono do produto).

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
| Cenários além do feitio: 6 engraçados (sorriso com dentes, olhos arregalados, óculos, cabelo novo, narigudo, pose ridícula) a 1 crédito, com expressão exagerada só nestes; "À medida" (texto 3–80) a 2 créditos | Pedido do dono do produto; o à medida custa mais e é verificado pela IA |
| Os animais falam como animais: 8 feitios universais (PT/EN), lógica de gato/cão, português neutro; personagens humanas inativas | Decisão do dono do produto: as piadas humanizadas não tinham graça |
| Sem Mac: EAS Build na cloud + Expo Go/builds de teste no iPhone; testes automáticos na web | O dono do produto só tem iPhone |
| Só modo claro na v1 | Identidade visual única; menos trabalho de design |
| App em `mobile/`, site antigo na raiz | Não misturar com o site existente |
| Design limpo e minimalista, cores vivas da moda (rosa choque, verde-lima, lilás); todos os botões com cor (primary/secondary/tertiary, sem botões só de texto); sem contornos, sombras suaves | Pedido do dono do produto: app jovem, com humor |
| Nome da app: **PetBubble** (petbubble.app) | Curto, funciona em PT e EN, liga ao balão |
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
  functions/generate          gasta 1 crédito, ou 2 com cenário à medida (SQL atómico) → 202; em segundo plano: Claude ("há animal?") → [à medida: Claude verifica e descreve o cenário] → fal (imagem) → Storage → Claude (frase sobre a imagem final)
  functions/new-phrase        a frase grátis (1 por geração), sem gastar crédito
  functions/delete-account    apaga fotos + utilizador (linhas apagadas em cascata)
  functions/_shared           ai.ts (Claude, fal), pipeline.ts (lógica testável), store.ts, prompts.ts
  tests/                      testes SQL (Postgres simples) — `supabase/tests/run.sh`
```

- Créditos: só as funções SQL `start_generation`, `fail_generation`, `grant_credits`… mexem em saldos, e só o `service_role` as pode chamar. A app só lê.
- Falhas devolvem sempre o crédito (`fail_generation` é idempotente). Gerações presas >5 min expiram e são reembolsadas.
- Limites: 5/min, 100/dia, 2 em curso por utilizador (`private.limits()`).
- Segredos (Edge Function secrets): `ANTHROPIC_API_KEY`, `FAL_KEY`; opcionais `TEXT_MODEL` (padrão `claude-opus-5-5`), `IMAGE_MODEL` (padrão `fal-ai/flux-pro/kontext`, escolhido por comparação: animal grande e fiel, 0,04 $, ~9 s).
- A app fica em **modo local** (Fase 1, sem servidor) se `mobile/.env` não tiver `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### Comandos do servidor
```bash
supabase/tests/run.sh                      # migrações + 31 testes SQL (precisa de PGHOST/PGPORT de um Postgres local)
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
    app/                       ecrãs (Expo Router): index → personality → (sign-in | no-credits) → result; history; settings
    design/                    design system: tokens.ts + AppText, Button, Screen
    i18n/                      i18next; locales/pt-PT.ts é a referência, en.ts igual em chaves
    features/
      personalities/data.ts    8 feitios por língua (espelho do servidor; frases só para modo local)
      backend/                 ÚNICA porta para dados: local.ts (Fase 1) ou remote.ts (Supabase); os ecrãs só usam `backend`
      auth/AuthContext.tsx     sessão, login com a Apple, créditos, terminar sessão, apagar conta
      translate/translate.ts   frases locais (só modo local)
      history/history.ts       histórico guardado no dispositivo
      draft/DraftContext.tsx   foto + personalidade escolhidas antes de traduzir
    components/                ThoughtBalloon, TranslationCanvas (vista exportada como PNG)
    lib/                       fotos (câmara/galeria), exportar/partilhar/guardar, kv (SQLite | localStorage)
```

- Balão: 68% da largura, arrastável (`balloon_x/y` em frações 0..1), "Mover balão" percorre os 4 cantos. Ao escrever a frase, a IA devolve a caixa da cabeça (`generations.head`, x/y/w/h 0..1); e do objeto principal da cena (`generations.prop`, ex.: comando, copo); sem posição escolhida, a app põe o balão no canto que menos tapa a cabeça e, depois, o objeto (`components/balloonLayout.ts`). Nunca tapa a marca de água.
- "Sem balão · grátis" no resultado: esconde o balão e partilha/guarda só a imagem (com marca de água).
- Frases da IA: lógica de animal, inspiradas no que os donos dizem dos bichos; a IA descarta a primeira ideia (óbvia). Máx. **45** caracteres (`PHRASE_MAX`), golpe seco no fim, nunca descrever a roupa/cenário. A IA dá 3 opções e o servidor escolhe a primeira que cabe; se nenhuma couber, pede outra vez uma vez.
- Cenários (`scenes`, no servidor, `image_prompt` escondido): escolhidos no ecrã do feitio; substituem o cenário do feitio. À medida: recusado (pessoas reais, marcas, impróprio…) → `scene_rejected`, 2 créditos devolvidos. No modo local não há cenários.
- Frase própria: "Escrever a minha frase", máx. **45** caracteres (`CUSTOM_PHRASE_MAX` e `check` na BD), grátis, sem IA; `custom_phrase` substitui a frase da IA no balão.
- Balão: rasto de 3 bolinhas desenhado na foto, a apontar para a cabeça e a parar antes dela (encolhem ou desaparecem se não houver espaço); cor pastel (`colors.balloonTints`) estável por tradução (`tintFor(id)`), tocar no balão troca a cor.
- Marca de água fixa em todas as imagens (canto inferior direito, pequena): "Feito com IA · PetBubble" (AI Act da UE + publicidade). Não se pode remover. Só não aparece no ecrã de espera, que mostra a foto original.
- A imagem partilhada é a captura de `TranslationCanvas` (`react-native-view-shot`): foto original + balão desenhado pela app.
- Ficheiros `*.web.ts` substituem os nativos na web (ex.: `kv.web.ts`).
- Língua: `pt*` no dispositivo → PT-PT; tudo o resto → EN.
