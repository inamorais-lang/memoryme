#!/usr/bin/env bash
# Para e remove os serviços. Não apaga a memória nem os ficheiros do repositório.
set -euo pipefail
source "$(dirname "$0")/_env.sh"
UNIT_DIR="$HOME/.config/systemd/user"
systemctl --user disable --now "$ASSISTANT_NAME-tick.timer" "$ASSISTANT_NAME-routines.timer" "$ASSISTANT_NAME-session.service" 2>/dev/null || true
for f in session.service tick.service tick.timer routines.service routines.timer; do rm -f "$UNIT_DIR/$ASSISTANT_NAME-$f"; done
systemctl --user daemon-reload
screen -S "$ASSISTANT_NAME" -X quit 2>/dev/null || true
echo "Serviços removidos. A memória (memory/) e as rotinas ficaram intactas."
