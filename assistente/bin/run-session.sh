#!/usr/bin/env bash
# Sessão principal: claude + plugin do Telegram, dentro de um screen, com id de sessão fixo.
set -euo pipefail
source "$(dirname "$0")/_env.sh"
cd "$ROOT"
mkdir -p state logs
export TERM="${TERM:-xterm-256color}"
[[ "$TERM" == "dumb" ]] && export TERM=xterm-256color

SID_FILE="$ROOT/state/session-id"
if [[ ! -s "$SID_FILE" ]]; then
  cat /proc/sys/kernel/random/uuid 2>/dev/null >"$SID_FILE" || uuidgen | tr 'A-Z' 'a-z' >"$SID_FILE"
fi
SID="$(tr -d '[:space:]' <"$SID_FILE")"
PROJ_DIR="$HOME/.claude/projects/$(printf '%s' "$ROOT" | sed 's/[^a-zA-Z0-9]/-/g')"
if [[ -f "$PROJ_DIR/$SID.jsonl" ]]; then SESSION_FLAG=(--resume "$SID"); else SESSION_FLAG=(--session-id "$SID"); fi

# Avisa que voltou (no máximo 1 vez a cada 10 min, para um ciclo de falhas não te encher de mensagens).
( sleep 20; "${CLI[@]}" notify --rate-limit online:10 "🟢 De volta online" ) >>"$ROOT/logs/notify.log" 2>&1 &

CMD=(claude
  --channels plugin:telegram@claude-plugins-official
  --settings '{"enabledPlugins":{"telegram@claude-plugins-official":true}}'
  "${SESSION_FLAG[@]}")

# Manter a máquina acordada (num VPS normalmente não é preciso; KEEP_AWAKE=1 para forçar).
WRAP=()
if [[ "${KEEP_AWAKE:-auto}" != "0" ]] && command -v systemd-inhibit >/dev/null \
   && systemd-inhibit --what=idle:sleep --who=test --why=test --mode=block true >/dev/null 2>&1; then
  WRAP=(systemd-inhibit --what=idle:sleep --who="$ASSISTANT_NAME" --why="Assistente pessoal" --mode=block)
fi

echo "$(date -Is) a iniciar sessão ${SESSION_FLAG[*]}"
# screen -D -m fica em primeiro plano (o systemd vigia-o); liga-te com: screen -r $ASSISTANT_NAME
exec "${WRAP[@]}" screen -D -m -S "$ASSISTANT_NAME" "${CMD[@]}"
