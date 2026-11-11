# Lista para a aprovação da Apple

Estado a 11 de novembro de 2026. ✅ feito · ⏳ por fazer (fase indicada) · ❗ precisa de decisão ou ação da Ana

## Privacidade e dados (diretrizes 5.1)
| Requisito | Estado |
|---|---|
| Apagar conta dentro da app (5.1.1(v)) | ✅ Definições → Apagar conta: apaga conta, fotos, imagens e créditos |
| Apagar uma imagem | ✅ "Apagar imagem" no ecrã da imagem (função `delete-image`) |
| Revogar o token do "Iniciar sessão com a Apple" ao apagar a conta | ⏳ Fase 3 (precisa das chaves da conta Apple Developer) |
| Política de Privacidade dentro da app | ✅ Definições e ecrã de login → abre a página |
| Política de Privacidade com link público (App Store Connect) | ❗ ligar o GitHub Pages (email já nas páginas: petbubble.ai@icloud.com) |
| Termos e Condições (EULA próprio, inclui as cláusulas da Apple; arbitragem individual nos EUA, limites de responsabilidade, indemnização) | ✅ escritos em PT e EN (`docs/legal`), com o email de contacto |
| Partilha de dados com IA de terceiros: avisar e pedir autorização explícita antes de enviar a foto (5.1.2(i)) | ✅ ecrã "A tua foto vai para a IA" antes da 1.ª imagem; o servidor recusa sem autorização e guarda a data; retirar nas Definições |
| "Etiquetas de privacidade" no App Store Connect | ⏳ Fase 3: identificador do utilizador, email (opcional), fotos (conteúdo do utilizador), compras; sem rastreio, sem publicidade |
| RGPD: fotos originais apagadas em menos de 24 h | ✅ apagadas logo após a imagem + limpeza de hora a hora |

## Conta e login (4.8)
| Requisito | Estado |
|---|---|
| Só "Iniciar sessão com a Apple" | ✅ |
| Login só quando é preciso (não logo ao abrir) | ✅ |

## Compras (3.1)
| Requisito | Estado |
|---|---|
| Créditos vendidos só por compras na app da Apple | ⏳ Fase 3 (StoreKit + Superwall) |
| Validação das compras no servidor, sem duplicar créditos | ⏳ Fase 3 |
| Preços e o que se compra claros antes de pagar | ✅ botões mostram o custo; ⏳ paywall na Fase 3 |

## Conteúdo e IA
| Requisito | Estado |
|---|---|
| Marca "Feito com IA" nas imagens | ✅ fixa, não se pode remover |
| Filtro de pedidos impróprios (cenário à medida) | ✅ a IA recusa pessoas reais, marcas, conteúdo sexual, violência, etc. |
| Sem pessoas reais nem marcas nos modos | ✅ |
| Classificação etária | ❗ responder ao questionário: "Hora do Vinho" tem referências ligeiras a álcool. Idade mínima nos Termos: **16 anos** (consentimento RGPD sem pais em todos os países) → escolher 16+ |

## App completa (2.1, 2.3, 4.2)
| Requisito | Estado |
|---|---|
| Nada de "em breve", tudo funciona | ✅ |
| Textos de permissão (câmara, fotos, guardar) em PT e EN | ✅ |
| Declaração de encriptação (só HTTPS → isenta) | ✅ `usesNonExemptEncryption: false` |
| Notas para o revisor da Apple (como testar, compras em sandbox) | ⏳ Fase 4 |
| Capturas de ecrã e descrição corretas | ⏳ Fase 4 |

## União Europeia (Digital Services Act)
| Requisito | Estado |
|---|---|
| Declarar o estatuto de "comerciante" no App Store Connect | ❗ obrigatório para vender na UE. Como pessoa singular, a Apple mostra publicamente na App Store o nome, a **morada, o telefone e o email** que indicares |
