#!/usr/bin/env bash
# Fecha o screen; o systemd volta a arrancar a sessão (mesma conversa) em ~30 s.
set -euo pipefail
source "$(dirname "$0")/_env.sh"
screen -S "$ASSISTANT_NAME" -X quit || systemctl --user restart "$ASSISTANT_NAME-session.service"
echo "A reiniciar — volto em ~30 s."
