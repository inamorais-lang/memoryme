# Roadmap

> **Sem Mac:** não usamos Xcode nem simulador. As builds são feitas na cloud com o EAS e os testes são feitos na versão web (automáticos) e no iPhone (manuais).

Cada fase começa com um plano curto, que tem de ser aprovado antes de executar. Cada fase termina com algo a funcionar e testado.

## Fase 1 — A ação principal a funcionar (dados locais)
**Objetivo:** foto → personalidade → frase → balão → partilhar, a correr no iPhone (Expo Go) e na versão web.

- Projeto Expo + Expo Router + TypeScript
- Design system: cores, tipografia e espaçamentos num só ficheiro
- i18n desde o início: PT-PT e EN, todos os textos num só sítio
- Ecrãs: principal, escolher personalidade, resultado, histórico
- Câmara e galeria, com textos de permissão
- Balão de pensamento desenhado por cima da foto e exportado como imagem
- Partilhar e guardar no rolo
- Frases **locais** pré-escritas por personalidade (sem IA, sem custos)
- Histórico guardado no dispositivo
- CLAUDE.md com comandos e arquitetura

**Fora:** contas, servidor, IA, pagamentos.

## Fase 2 — Contas, base de dados, IA e sincronização
**Objetivo:** frases reais da IA, protegidas por créditos no servidor.

- Supabase: tabelas `profiles`, `credit_ledger`, `generations`, `personalities` e `purchases`, todas com RLS
- Iniciar sessão com a Apple
- Supabase Storage para as fotos (pastas privadas por utilizador)
- Edge Function `generate`: valida o crédito, desconta-o de forma atómica, aplica rate limiting, chama a IA e devolve o crédito se falhar
- Escolha do modelo de IA, com testes de qualidade e custo
- Personalidades vindas do servidor
- Histórico sincronizado
- Apagar conta (com revogação do token da Apple)
- Créditos de teste atribuídos manualmente (ainda sem compras)

## Fase 3 — Onboarding, paywall e analytics → TestFlight
**Objetivo:** o funil completo, pronto para testers.

- Onboarding de 3 ecrãs com a galeria de exemplos
- Produtos consumíveis no App Store Connect (0,99 € / 3,99 € / 7,99 € / 19,99 €)
- Paywall Superwall + compra StoreKit
- Edge Function `verify-purchase` (App Store Server API, uma transação = créditos só uma vez)
- Notificações da App Store para reembolsos
- Restaurar compras
- PostHog com todos os eventos do funil
- Sentry na app e nas Edge Functions
- Política de privacidade e termos
- EAS Build (cloud) → EAS Submit → TestFlight
- Builds de teste (development build) instaladas no iPhone, para testar login e compras

## Fase 4 — Polimento e submissão na App Store
**Objetivo:** aprovação à primeira.

- Afinar animações, estados vazios e mensagens de erro
- Ícone, ecrã de arranque e capturas para a App Store (PT e EN)
- Email de confirmação com o Resend (ex.: conta apagada)
- EAS Update configurado
- Lista de verificação da Apple (ver PRD §9)
- Submissão

## Depois do lançamento
- PT-BR, ES, FR, IT, com personalidades locais
- Estilo "premium" com imagem gerada pela IA
- Novas personalidades por temporada (Natal, Santos Populares, Halloween)
- Android
