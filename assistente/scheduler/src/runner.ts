import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Routine } from './routines'
import { shortReason } from './util'

export type ClaudeResult = { code: number | null; stdout: string; stderr: string; timedOut: boolean }
export type ClaudeRunner = (args: string[], opts: { cwd: string; timeoutMs: number }) => Promise<ClaudeResult>

export const PLUGIN = 'telegram@claude-plugins-official'

export const PREAMBLE = `Estás a correr a rotina agendada "{name}" do assistente pessoal.
Regras desta execução (prevalecem sobre o CLAUDE.md):
- Execução sem supervisão e SÓ DE LEITURA: não edites ficheiros, não faças commits, não envies emails nem alteres nada fora daqui. Se algo deve mudar, propõe a mudança no texto.
- Não uses ferramentas do Telegram: o teu texto final é enviado tal como está para o telemóvel.
- Curto e fácil de ler no telemóvel; sem tabelas. Responde na língua das instruções abaixo.
- A memória de longo prazo está em memory/ (pendencias.md, negocio.md, pedidos.md, clientes.md, log/). Usa \`date\` para saber a data de hoje.
{relevance}
Instruções da rotina:
`

const RELEVANCE_ONLY = `- Modo "só se relevante": se não houver nada que valha a pena dizer, responde exatamente NOTHING e mais nada.`

const BASE_DISALLOWED = [
  'Edit',
  'Write',
  'NotebookEdit',
  'Bash(git add:*)',
  'Bash(git commit:*)',
  'Bash(git push:*)',
  'Bash(bin/fresh-start.sh:*)',
  'Bash(bin/restart.sh:*)',
  'Bash(bin/run-now.sh:*)',
  'Bash(bin/notify.sh:*)',
  'Bash(bin/install.sh:*)',
  'Bash(bin/uninstall.sh:*)',
]

const READ_ONLY_TOOL = /(^|[_-])(get|list|search|fetch|query|read|find|retrieve|describe|view|lookup)/i

/** Ferramentas MCP pré-autorizadas em .claude/settings.json que NÃO parecem só de leitura. */
export function preAllowedWriteTools(root: string): string[] {
  const path = join(root, '.claude', 'settings.json')
  if (!existsSync(path)) return []
  try {
    const allow: string[] = JSON.parse(readFileSync(path, 'utf8'))?.permissions?.allow ?? []
    return allow.filter((t) => t.startsWith('mcp__') && !READ_ONLY_TOOL.test(t.split('__').pop() ?? ''))
  } catch {
    return []
  }
}

export function buildArgs(routine: Routine, root: string): string[] {
  const preamble = PREAMBLE.replace('{name}', routine.name).replace(
    '{relevance}',
    routine.mode === 'only-if-relevant' ? RELEVANCE_ONLY + '\n' : '',
  )
  const allow = new Set(routine.allowTools)
  const disallowed = [...BASE_DISALLOWED, ...preAllowedWriteTools(root)].filter((t) => !allow.has(t))
  const args = [
    '-p',
    preamble + routine.body,
    '--output-format',
    'text',
    '--permission-mode',
    'default',
    '--settings',
    JSON.stringify({ enabledPlugins: { [PLUGIN]: false } }),
    '--disallowedTools',
    ...disallowed,
  ]
  if (routine.allowTools.length) args.push('--allowedTools', ...routine.allowTools)
  return args
}

/** Corre a rotina e devolve a mensagem a enviar, ou null se a resposta for NOTHING. */
export async function runRoutine(
  routine: Routine,
  root: string,
  run: ClaudeRunner,
  late = false,
): Promise<{ message: string | null; ok: boolean }> {
  const res = await run(buildArgs(routine, root), { cwd: root, timeoutMs: routine.timeoutMin * 60_000 })
  if (res.timedOut) return { ok: false, message: `⚠️ ${routine.name} falhou: passou do limite de ${routine.timeoutMin} min` }
  if (res.code !== 0) return { ok: false, message: `⚠️ ${routine.name} falhou: ${shortReason(res.stderr || res.stdout)}` }
  const text = res.stdout.trim()
  if (!text) return { ok: false, message: `⚠️ ${routine.name} falhou: resposta vazia` }
  if (/^NOTHING\.?$/.test(text)) return { ok: true, message: null }
  return { ok: true, message: `[${routine.name}${late ? ' · atrasada' : ''}] ${text}` }
}

export const spawnClaude: ClaudeRunner = async (args, { cwd, timeoutMs }) => {
  const bin = process.env.CLAUDE_BIN || 'claude'
  const proc = Bun.spawn([bin, ...args], { cwd, stdin: 'ignore', stdout: 'pipe', stderr: 'pipe' })
  const collected = Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited])
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), timeoutMs)
  })
  const first = await Promise.race([collected, timeout])
  clearTimeout(timer)
  if (first !== 'timeout') {
    const [stdout, stderr, code] = first
    return { code, stdout, stderr, timedOut: false }
  }
  // Timeout: termina o processo e os filhos (servidores MCP podem manter os pipes abertos).
  Bun.spawnSync(['pkill', '-TERM', '-P', String(proc.pid)])
  proc.kill('SIGTERM')
  setTimeout(() => {
    Bun.spawnSync(['pkill', '-KILL', '-P', String(proc.pid)])
    proc.kill('SIGKILL')
  }, 5000).unref?.()
  return { code: null, stdout: '', stderr: '', timedOut: true }
}
