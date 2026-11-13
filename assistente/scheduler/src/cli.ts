#!/usr/bin/env bun
// Uso: cli.ts tick | routines | status | run-now <nome> | notify [--rate-limit chave:minutos] "<texto>"
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { nextRun } from './cron'
import { runRoutine, spawnClaude } from './runner'
import { telegramSender } from './telegram'
import { loadRoutines, paths, runDueRoutines, sendOrQueue, tick, type Deps, type Health, type Reminder } from './tick'
import { appendLog, formatWhen, readJson, writeJsonAtomic } from './util'

const ROOT = process.env.ASSISTANT_ROOT ?? join(import.meta.dir, '..', '..')

function loadEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!existsSync(path)) return out
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return out
}

for (const [k, v] of Object.entries(loadEnvFile(join(ROOT, '.env.local')))) process.env[k] ??= v
const NAME = process.env.ASSISTANT_NAME || 'assistente'
const TG_DIR = process.env.TELEGRAM_STATE_DIR || join(homedir(), '.claude', 'channels', 'telegram')
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || loadEnvFile(join(TG_DIR, '.env')).TELEGRAM_BOT_TOKEN || ''
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''

function sh(cmd: string[]): { ok: boolean; out: string } {
  try {
    const r = Bun.spawnSync(cmd, { stdout: 'pipe', stderr: 'pipe' })
    return { ok: r.exitCode === 0, out: r.stdout.toString().trim() }
  } catch {
    return { ok: false, out: '' }
  }
}

function pidAlive(pidFile: string): boolean {
  try {
    const pid = Number(readFileSync(pidFile, 'utf8').trim())
    if (!pid) return false
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function health(): Promise<Health> {
  const problems: string[] = []
  if (!sh(['systemctl', '--user', 'is-active', '--quiet', `${NAME}-session.service`]).ok)
    problems.push('o serviço da sessão não está ativo')
  else if (!sh(['screen', '-ls', NAME]).out.includes(`.${NAME}`)) problems.push(`o screen "${NAME}" não está a correr`)
  if (!pidAlive(join(TG_DIR, 'bot.pid'))) problems.push('o leitor do Telegram (plugin) não está a correr')
  return { ok: problems.length === 0, problems }
}

const deps: Deps = {
  root: ROOT,
  now: () => new Date(),
  send: telegramSender(TOKEN, CHAT_ID),
  runClaude: spawnClaude,
  health: process.env.HEALTHCHECK === '0' ? undefined : health,
  warn: (m) => console.error(m),
}

function ago(iso?: string): string {
  if (!iso) return 'nunca'
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000)
  if (s < 90) return `há ${s} s`
  if (s < 5400) return `há ${Math.round(s / 60)} min`
  return `há ${Math.round(s / 3600)} h`
}

function status(): string {
  const P = paths(ROOT)
  const lines = ['📊 Estado do assistente']
  const active = sh(['systemctl', '--user', 'is-active', `${NAME}-session.service`]).out || 'desconhecido'
  const since = sh(['systemctl', '--user', 'show', `${NAME}-session.service`, '-p', 'ActiveEnterTimestamp', '--value']).out
  lines.push(`Sessão: ${active}${since ? ` desde ${since}` : ''}`)
  lines.push(`Telegram (plugin): ${pidAlive(join(TG_DIR, 'bot.pid')) ? 'a correr' : 'parado'}`)
  lines.push(`Último tick: ${ago(readJson<{ lastTick?: string }>(P.tickState, {}).lastTick)}`)

  const routines = loadRoutines(ROOT)
  lines.push('', `Rotinas (${routines.length}):`)
  if (!routines.length) lines.push('• nenhuma')
  for (const { file, routine, error } of routines) {
    if (!routine) {
      lines.push(`• ${file} — ⚠️ ${error}`)
      continue
    }
    const next = routine.enabled ? nextRun(routine.cron, new Date()) : null
    lines.push(
      `• ${routine.name} — "${routine.schedule}" — ${routine.enabled ? `próxima: ${next ? formatWhen(next) : '?'}` : 'pausada'}`,
    )
  }

  let reminders: Reminder[] = []
  try {
    reminders = readJson<Reminder[]>(P.reminders, [])
  } catch {
    lines.push('', '⚠️ reminders.json inválido')
  }
  lines.push('', `Lembretes pendentes (${reminders.length}):`)
  for (const r of [...reminders].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)))
    lines.push(`• ${formatWhen(new Date(r.at))} — ${r.text}`)
  return lines.join('\n')
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2)
  switch (cmd) {
    case 'tick':
      await tick(deps)
      break
    case 'routines':
      await runDueRoutines(deps)
      break
    case 'status':
      console.log(status())
      break
    case 'run-now': {
      const name = args[0]
      const found = loadRoutines(ROOT).find((l) => l.file === `${name}.md`)
      if (!found) throw new Error(`rotina "${name}" não existe em schedules/routines/`)
      if (!found.routine) throw new Error(`rotina ${found.file} com erro: ${found.error}`)
      const { message } = await runRoutine(found.routine, ROOT, spawnClaude)
      const text = message ?? `[${name}] (teste) nada a reportar — a rotina respondeu NOTHING`
      await sendOrQueue(deps, text)
      appendLog(ROOT, new Date(), `teste da rotina ${name}`)
      console.log(text)
      break
    }
    case 'notify': {
      let text = args.join(' ')
      if (args[0] === '--rate-limit') {
        const [key, minutes] = (args[1] ?? '').split(':')
        text = args.slice(2).join(' ')
        const file = join(paths(ROOT).state, 'notify-rate.json')
        const seen = readJson<Record<string, number>>(file, {})
        const windowMs = Number(minutes || 10) * 60_000
        if (seen[key] && Date.now() - seen[key] < windowMs) return
        seen[key] = Date.now()
        writeJsonAtomic(file, seen)
      }
      if (!text) throw new Error('falta o texto')
      await sendOrQueue(deps, text)
      break
    }
    default:
      console.error('uso: cli.ts tick | routines | status | run-now <nome> | notify [--rate-limit chave:min] "<texto>"')
      process.exit(2)
  }
}

main().catch((e) => {
  console.error(`erro: ${e?.message ?? e}`)
  process.exit(1)
})
