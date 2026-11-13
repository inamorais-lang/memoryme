#!/usr/bin/env bash
# run-now.sh <nome-da-rotina> — testa uma rotina já, em segundo plano; o resultado chega no Telegram.
set -euo pipefail
source "$(dirname "$0")/_env.sh"
name="${1:?uso: run-now.sh <nome-da-rotina>}"
[[ "$name" =~ ^[a-z0-9-]+$ ]] || { echo "nome inválido: $name"; exit 1; }
[[ -f "$ROOT/schedules/routines/$name.md" ]] || { echo "não existe schedules/routines/$name.md"; exit 1; }
mkdir -p "$ROOT/logs"
nohup "${CLI[@]}" run-now "$name" >>"$ROOT/logs/run-now.log" 2>&1 &
echo "A testar a rotina \"$name\" em segundo plano — o resultado chega no Telegram."
