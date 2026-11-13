#!/usr/bin/env bash
# Instala/atualiza os serviços systemd (idempotente). Corre no servidor, dentro da pasta assistente/.
set -euo pipefail
source "$(dirname "$0")/_env.sh"
cd "$ROOT"
PLUGIN="telegram@claude-plugins-official"
TG_DIR="${TELEGRAM_STATE_DIR:-$HOME/.claude/channels/telegram}"
UNIT_DIR="$HOME/.config/systemd/user"
ok()   { echo "  ✅ $*"; }
fail() { echo "  ❌ $*"; FAILED=1; }
FAILED=0

echo "1) Verificações"
command -v claude >/dev/null && ok "claude $(claude --version 2>/dev/null | head -1)" || fail "claude não encontrado (npm install -g @anthropic-ai/claude-code)"
command -v bun    >/dev/null && ok "bun $(bun --version)"   || fail "bun não encontrado (curl -fsSL https://bun.sh/install | bash)"
command -v screen >/dev/null && ok "screen"                 || fail "screen não encontrado (sudo apt install screen)"
command -v git    >/dev/null && ok "git"                    || fail "git não encontrado"
grep -q '^TELEGRAM_BOT_TOKEN=.' "$TG_DIR/.env" 2>/dev/null && ok "token do bot em $TG_DIR/.env" || fail "falta o token: corre /telegram:configure <token> dentro do claude"
[[ -n "${TELEGRAM_CHAT_ID:-}" ]] && ok "TELEGRAM_CHAT_ID em .env.local" || fail "falta TELEGRAM_CHAT_ID em .env.local (cp .env.example .env.local)"
if grep -q '"allowFrom": *\[ *"' "$TG_DIR/access.json" 2>/dev/null; then ok "conta emparelhada"; else echo "  ⚠️  ainda não emparelhaste a tua conta (passo 5 do guia)"; fi
grep -q '"dmPolicy": *"allowlist"' "$TG_DIR/access.json" 2>/dev/null && ok "acesso só por allowlist" || echo "  ⚠️  muda o acesso para allowlist: /telegram:access policy allowlist"

# O plugin "rouba" o token: tem de estar DESLIGADO a nível de utilizador e só ligado na sessão principal.
USER_SETTINGS="$HOME/.claude/settings.json"
state=$(bun -e "try{const s=require('$USER_SETTINGS');console.log(String(s.enabledPlugins?.['$PLUGIN']))}catch{console.log('missing')}")
if [[ "$state" == "false" ]]; then
  ok "plugin desligado a nível de utilizador"
else
  echo "  ⚠️  o plugin do Telegram está ligado para TODAS as sessões claude (estado: $state)."
  read -r -p "     Desligá-lo em ~/.claude/settings.json? [S/n] " a
  if [[ ! "$a" =~ ^[nN] ]]; then
    bun -e "
      const fs=require('fs');const p='$USER_SETTINGS';
      let s={};try{s=JSON.parse(fs.readFileSync(p,'utf8'))}catch{}
      s.enabledPlugins={...(s.enabledPlugins||{}),'$PLUGIN':false};
      fs.mkdirSync(require('path').dirname(p),{recursive:true});
      fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n')"
    ok "plugin desligado a nível de utilizador"
  else
    fail "plugin ainda ligado a nível de utilizador"
  fi
fi

if command -v loginctl >/dev/null && [[ "$(loginctl show-user "$USER" -p Linger --value 2>/dev/null)" != "yes" ]]; then
  fail "sem 'linger': os serviços param quando sais do SSH. Corre: sudo loginctl enable-linger $USER"
else
  ok "linger ativo (os serviços correm sem sessão SSH aberta)"
fi

[[ $FAILED == 0 ]] || { echo; echo "Corrige os ❌ acima e volta a correr bin/install.sh"; exit 1; }

echo; echo "2) Testes"
bun install --silent && bun run test >/dev/null 2>&1 && ok "testes passam" || { echo "  ❌ testes falharam: corre 'bun run test'"; exit 1; }

echo; echo "3) Pastas permitidas"
REPO_ROOT="$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null || dirname "$ROOT")"
DIRS="${ALLOWED_DIRS:-$REPO_ROOT}"
bun -e "
  const dirs=process.argv[1].split(':').filter(Boolean);
  require('fs').writeFileSync('$ROOT/.claude/settings.local.json',JSON.stringify({permissions:{additionalDirectories:dirs}},null,2)+'\n')
" "$DIRS"
ok ".claude/settings.local.json → $DIRS"

echo; echo "4) Serviços systemd ($ASSISTANT_NAME-session, -tick, -routines)"
read -r -p "   Instalar/atualizar e arrancar os serviços agora? [S/n] " a
[[ "$a" =~ ^[nN] ]] && { echo "   Nada instalado."; exit 0; }
mkdir -p "$UNIT_DIR" "$ROOT/logs"
for f in session.service tick.service tick.timer routines.service routines.timer; do
  sed -e "s#__ROOT__#$ROOT#g" -e "s#__HOME__#$HOME#g" -e "s#__NAME__#$ASSISTANT_NAME#g" \
    "$ROOT/systemd/$f" >"$UNIT_DIR/$ASSISTANT_NAME-$f"
done
systemctl --user daemon-reload
systemctl --user enable --now "$ASSISTANT_NAME-tick.timer" "$ASSISTANT_NAME-routines.timer" >/dev/null
systemctl --user enable "$ASSISTANT_NAME-session.service" >/dev/null
systemctl --user restart "$ASSISTANT_NAME-session.service"
ok "serviços a correr"

cat <<MSG

Pronto. Em ~30 s deves receber "🟢 De volta online" no Telegram.
  Estado:            bin/status.sh
  Ver a sessão:      screen -r $ASSISTANT_NAME     (sair sem fechar: Ctrl-A depois D)
  Logs:              tail -f logs/session.log logs/tick.log logs/routines.log
  Reiniciar:         bin/restart.sh
  Conversa nova:     bin/fresh-start.sh
  Desinstalar:       bin/uninstall.sh
MSG
