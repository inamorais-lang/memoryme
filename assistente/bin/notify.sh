#!/usr/bin/env bash
# notify.sh "texto"  — envia uma mensagem para o teu Telegram
set -euo pipefail
source "$(dirname "$0")/_env.sh"
exec "${CLI[@]}" notify "$@"
