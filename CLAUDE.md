# CLAUDE.md

App iOS que "traduz" o pensamento de um gato ou cão: foto + personalidade → foto com balão de pensamento sarcástico.

- Produto: `docs/PRD.md`
- Fases: `docs/ROADMAP.md`
- Estado atual: **antes da Fase 1** (ainda sem código)

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
| A IA só escreve texto; o balão é desenhado na app | ~0,01 €/foto, rápido, não deforma o animal |
| Sem foto grátis; packs consumíveis de 0,99 € / 3,99 € / 7,99 € / 19,99 € (1/5/10/30) | Evita abuso e custos de IA sem receita |
| 1 nova tentativa grátis por foto e personalidade | Custo baixo; evita frustração |
| Login com a Apple só na primeira compra | Menos fricção no início |
| Saldo de créditos só no servidor; validação própria das transações da Apple | O Superwall não guarda saldos de consumíveis |
| Personalidades configuradas no servidor (a partir da Fase 2) | Afinar sem lançar uma nova versão |
| Arquétipos em EN em vez de pessoas reais | Regra 5.2 da App Store e direito de imagem |

## Comandos
_A preencher na Fase 1._

## Arquitetura
_A preencher na Fase 1._
