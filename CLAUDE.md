# CLAUDE.md

App iOS que "traduz" o pensamento de um gato ou cão: foto + personalidade → foto com balão de pensamento sarcástico.

- Produto: `docs/PRD.md`
- Fases: `docs/ROADMAP.md`
- Estado atual: **Fase 1 concluída** (fluxo principal com frases locais, sem servidor). Na Fase 1 a imagem ainda não é transformada: isso chega com a IA na Fase 2.

## Regras não negociáveis
- Chaves secretas (IA, service role do Supabase) **só** em Supabase Edge Functions. Nunca no código da app nem em variáveis `EXPO_PUBLIC_*`.
- Nenhuma geração de IA sem crédito validado e descontado no servidor, com rate limiting por utilizador.
- RLS em todas as tabelas.
- Todo o texto visível vem do i18n (`pt-PT` é a língua de referência, `en` é a segunda). Nada de texto escrito diretamente nos componentes.
- Cores, tipografia e espaçamentos só a partir do design system. Nada de valores soltos nos ecrãs.
- Sem nomes, fotos ou citações de pessoas reais nas personalidades.
- Nada de "em breve" na app.
- Antes de cada fase: plano curto, aprovado pelo dono do produto.
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
| Arquétipos em EN em vez de pessoas reais | Regra 5.2 da App Store e direito de imagem |
| Sem Mac: EAS Build na cloud + Expo Go/builds de teste no iPhone; testes automáticos na web | O dono do produto só tem iPhone |
| Só modo claro na v1 | Identidade visual única; menos trabalho de design |
| App em `mobile/`, site antigo na raiz | Não misturar com o site existente |
| Fontes: Fraunces (títulos e balão) + DM Sans (texto) | Personalidade própria, não parecer "feito por IA" |

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

## Arquitetura
```
mobile/
  app.json                     nome, permissões (PT), plugins, idiomas iOS
  locales/ios/*.json           textos das permissões por idioma
  src/
    app/                       ecrãs (Expo Router): index → personality → result, history
    design/                    design system: tokens.ts + AppText, Button, Screen
    i18n/                      i18next; locales/pt-PT.ts é a referência, en.ts igual em chaves
    features/
      personalities/data.ts    12 personalidades (6 PT, 6 EN); no servidor a partir da Fase 2
      translate/translate.ts   ÚNICO ponto foto → frase (local agora; Edge Function na Fase 2)
      history/history.ts       histórico guardado no dispositivo
      draft/DraftContext.tsx   foto + personalidade escolhidas antes de traduzir
    components/                ThoughtBalloon, TranslationCanvas (vista exportada como PNG)
    lib/                       fotos (câmara/galeria), exportar/partilhar/guardar, kv (SQLite | localStorage)
```

- A imagem partilhada é a captura de `TranslationCanvas` (`react-native-view-shot`): foto original + balão desenhado pela app.
- Ficheiros `*.web.ts` substituem os nativos na web (ex.: `kv.web.ts`).
- Língua: `pt*` no dispositivo → PT-PT; tudo o resto → EN.
