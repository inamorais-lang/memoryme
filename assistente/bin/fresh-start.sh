#!/usr/bin/env bash
# Conversa nova (a memória em memory/ mantém-se).
set -euo pipefail
source "$(dirname "$0")/_env.sh"
rm -f "$ROOT/state/session-id" "$ROOT/state/notify-rate.json"
"${CLI[@]}" notify "🔄 A começar uma conversa nova (a memória mantém-se). Volto em ~30 s." || true
screen -S "$ASSISTANT_NAME" -X quit || systemctl --user restart "$ASSISTANT_NAME-session.service"
