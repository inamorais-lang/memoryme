#!/usr/bin/env bash
# Chamado pelos timers do systemd: scheduler.sh tick | routines
set -euo pipefail
source "$(dirname "$0")/_env.sh"
exec "${CLI[@]}" "$@"
