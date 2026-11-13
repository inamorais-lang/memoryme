# Carregado pelos outros scripts: raiz, .env.local e PATH completo (o systemd tem um PATH mínimo).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export ASSISTANT_ROOT="$ROOT"
if [[ -f "$ROOT/.env.local" ]]; then set -a; source "$ROOT/.env.local"; set +a; fi
export ASSISTANT_NAME="${ASSISTANT_NAME:-assistente}"
export TZ="${TZ:-Europe/Lisbon}"
export PATH="$HOME/.local/bin:$HOME/.bun/bin:$HOME/.claude/local:$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
CLI=(bun "$ROOT/scheduler/src/cli.ts")
