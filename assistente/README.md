# Assistente pessoal (Telegram + Claude Code)

Falas com ele pelo **Telegram no iPhone**. Uma sessão Claude Code num **servidor Linux sempre ligado** faz o trabalho: lê e edita ficheiros nas pastas permitidas, guarda memória em markdown (git), envia lembretes e rotinas, e pede aprovação com botões ✅/❌ antes de qualquer coisa arriscada.

```
Telegram (iPhone)
   ⇅ Bot API (long polling, sem portas abertas)
Plugin oficial do Telegram  ← o ÚNICO que recebe mensagens
   ⇅
SESSÃO PRINCIPAL: claude --channels plugin:telegram@claude-plugins-official
                  id de sessão fixo (retomada ao reiniciar), dentro de `screen`,
                  vigiada pelo systemd (assistente-session.service)
SCHEDULER (sem IA), timers do systemd a cada minuto:
   ├─ assistente-tick      → schedules/reminders.json → envia ⏰ via sendMessage; reenvios; alertas de saúde
   └─ assistente-routines  → schedules/routines/*.md → `claude -p` (só leitura) → envia o resultado
```

> ⚠️ O assistente pode editar ficheiros e correr comandos no servidor, controlado a partir do Telegram. Mantém as pastas permitidas restritas e aprova os pedidos 🔐 com atenção.

## O que precisas

- Plano pago do Claude (Pro/Max) — o Claude Code usa a tua assinatura.
- Um **servidor Linux** sempre ligado. Sem computador próprio, um VPS pequeno chega (ex.: Hetzner CX22, ~4–6 €/mês, Ubuntu 24.04, 2 GB RAM).
- **Telegram** no iPhone.
- Uma app de **SSH no iPhone** para a instalação (ex.: Termius ou Blink Shell). Depois da instalação já não precisas dela no dia a dia.
- O Claude Code Channels está em *research preview*: se algum comando abaixo mudou, segue a documentação atual do plugin (`/plugin` → telegram → README).

---

## Instalação (passo a passo)

Todos os comandos são no servidor, por SSH.

### 1. Preparar o servidor

```sh
sudo apt update && sudo apt install -y git screen curl unzip
curl -fsSL https://claude.ai/install.sh | bash      # Claude Code
curl -fsSL https://bun.sh/install | bash            # Bun (o plugin e o scheduler precisam dele)
exec $SHELL -l                                      # recarrega o PATH
claude --version && bun --version
sudo loginctl enable-linger "$USER"                 # serviços continuam a correr depois de saíres do SSH
```

### 2. Clonar o repositório

```sh
git clone https://github.com/inamorais-lang/memoryme.git ~/memoryme
cd ~/memoryme
git switch claude/assistente-pessoal-aw6nd0          # (ou main, depois de fazeres merge)
cd assistente
bun install
bun run test                                         # deve dizer "0 fail"
```

Se o repositório for privado, o `git clone` pede o utilizador e um *personal access token* do GitHub.

### 3. Entrar no Claude Code (uma vez, nesta pasta)

```sh
cd ~/memoryme/assistente
claude
```

Faz login com a tua conta Claude (ele mostra um link; abre-o no iPhone e cola o código). Aceita **confiar nesta pasta**. Fica dentro do `claude` para o passo seguinte.

### 4. Criar o bot no Telegram

No Telegram, abre **@BotFather** → `/newbot` → escolhe um nome (ex.: "Assistente MemoryMe") e um username acabado em `bot`. Copia o token (`123456789:AA…`).

### 5. Instalar o plugin, configurar e emparelhar

Dentro do `claude` (passo 3):

```
/plugin install telegram@claude-plugins-official
/telegram:configure 123456789:AA...O_TEU_TOKEN
```

Sai (`/exit`) e arranca uma vez à mão com o canal ativo:

```sh
claude --channels plugin:telegram@claude-plugins-official
```

No iPhone, envia qualquer mensagem ao teu bot → ele responde com um **código de 6 caracteres**. No `claude`:

```
/telegram:access pair <código>
/telegram:access policy allowlist
/telegram:access set ackReaction 👀
```

Agora só a tua conta fala com o bot, e cada mensagem tua recebe 👀 quando chega. Sai do `claude` (`/exit`).

### 6. Configurar `.env.local`

```sh
cd ~/memoryme/assistente
cp .env.example .env.local
nano .env.local
```

- `TELEGRAM_CHAT_ID` — o teu id numérico. Está em `~/.claude/channels/telegram/access.json` (lista `allowFrom`), ou pede-o ao **@userinfobot**.
- `TZ` — o teu fuso (por omissão `Europe/Lisbon`).

### 7. Instalar os serviços

```sh
bin/install.sh
```

O script verifica tudo (claude, bun, screen, token, chat id, linger), **desliga o plugin a nível de utilizador** (pergunta antes) para que outras sessões `claude` não lhe roubem o bot, gera `.claude/settings.local.json` com as pastas permitidas e instala/arranca os serviços. Em ~30 s chega "🟢 De volta online".

Se não chegar: `screen -r assistente` mostra a sessão (pode estar à espera de uma confirmação no primeiro arranque — responde, depois `Ctrl-A` `D` para sair sem a fechar).

### 8. (Opcional) Ligar serviços MCP

Ex.: Gmail, Google Calendar, Notion. Adiciona-os ao Claude Code **com escopo de utilizador** (`claude mcp add --scope user …`) para que as rotinas também os vejam; prefere tokens só de leitura. Depois acrescenta os nomes exatos das ferramentas **só de leitura** (get/list/search/fetch/query) à lista `allow` em `.claude/settings.json`. Tudo o resto continua a pedir ✅/❌ no telemóvel.

---

## Lista de verificação (fazer juntos depois de instalar)

1. Uma mensagem de **outra conta** Telegram não recebe resposta.
2. "Que ficheiros tem o site?" → resposta correta (com 👀 primeiro).
3. "Lembra-me daqui a 2 minutos de alongar" → chega a horas; `schedules/reminders.json` volta a `[]`.
4. "Todos os dias às <agora+3 min> diz-me uma curiosidade" → cria a rotina; chega; "pausa essa rotina" funciona.
5. `pkill -f "claude --channels"` → volta sozinho e chega "🟢 De volta online".
6. "Apaga com rm -rf a pasta /tmp/teste" → bloqueado, mesmo que toques ✅.
7. Uma escrita MCP (ex.: criar evento) mostra 🔐; ❌ cancela, ✅ avança.
8. Abrir um `claude` normal noutra pasta do servidor **não** deixa o assistente surdo.
9. Escrever noutra língua → resposta nessa língua.

---

## Cábula (o que escrever no Telegram)

- **Lembrete:** "lembra-me amanhã às 10h de ligar à cliente Ana" · "daqui a 30 min: tirar o bolo"
- **Rotina:** "todos os dias úteis às 8h30 manda-me as pendências e entregas da semana" · "à segunda às 9h resume os pedidos em curso"
- **Rotinas:** "que rotinas tenho?" · "pausa o resumo da manhã" · "testa a rotina resumo-manha" · "apaga essa rotina"
- **Negócio:** "novo pedido: vídeo de homenagem para a família Costa, entrega até dia 28, 60 fotos" · "o que tenho para entregar esta semana?"
- **Site:** "muda o título da página principal para …" (cria um branch e faz commit; não faz push)
- **Estado:** "estado"
- **Conversa nova:** "conversa nova" (a memória mantém-se)

No servidor:

| | |
|---|---|
| Ver a sessão | `screen -r assistente` (sair: `Ctrl-A` `D`) |
| Estado | `bin/status.sh` |
| Logs | `tail -f logs/session.log logs/tick.log logs/routines.log` |
| Reiniciar (mesma conversa) | `bin/restart.sh` |
| Conversa nova | `bin/fresh-start.sh` |
| Testar uma rotina | `bin/run-now.sh <nome>` |
| Mensagem manual | `bin/notify.sh "texto"` |
| Desinstalar | `bin/uninstall.sh` |

## Estrutura

```
CLAUDE.md                  persona e regras (manual do assistente)
memory/                    memória de longo prazo (git): pendencias, pedidos, clientes, negocio, log/
schedules/reminders.json   lembretes únicos
schedules/routines/        uma rotina por ficheiro .md (vazio na instalação)
scheduler/                 scheduler em TypeScript/Bun + testes (bun run test)
bin/                       run-session, install, uninstall, restart, fresh-start, status, run-now, notify
systemd/                   modelos dos serviços (__ROOT__/__HOME__/__NAME__)
.claude/settings.json      permissões (allow/deny)
.env.local                 (fora do git) chat id, fuso, nome
logs/, state/              (fora do git)
```

## Segurança — como está montado

- **Só a tua conta** fala com o bot (allowlist do plugin).
- O plugin está **desligado a nível de utilizador** e só é ligado na sessão principal (`--settings`). As rotinas desligam-no explicitamente outra vez.
- O scheduler **só envia** (Bot API `sendMessage`), nunca recebe — não compete com o plugin.
- **Bloqueado mesmo com ✅:** `rm -r/-rf`, `git push --force`, `git reset --hard`, `git clean`, `sudo`; ler `~/.ssh`, `~/.aws`, credenciais do Claude/GitHub, o token e o access.json do bot; editar `.env*`, `~/.claude/channels/**`, as permissões, e a própria infraestrutura (`bin/`, `scheduler/`, `systemd/`).
- As **rotinas são só de leitura** por imposição: `claude -p` com `Edit`/`Write`/commits/scripts de estado e ferramentas MCP de escrita bloqueados; em modo `-p` tudo o que precisaria de aprovação é recusado.
- Emails, páginas e mensagens de clientes são tratados como dados, nunca como instruções.
