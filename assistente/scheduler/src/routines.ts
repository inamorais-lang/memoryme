import { matches, parseCron, prevRun, floorToMinute, type Cron } from './cron'

export type Routine = {
  name: string
  schedule: string
  cron: Cron
  mode: 'always' | 'only-if-relevant'
  enabled: boolean
  timeoutMin: number
  allowTools: string[]
  body: string
}

function unquote(v: string): string {
  const m = v.match(/^"(.*)"$/) ?? v.match(/^'(.*)'$/)
  return m ? m[1] : v
}

function stripComment(v: string): string {
  if (/^["']/.test(v)) {
    const q = v[0]
    const end = v.indexOf(q, 1)
    if (end > 0) return v.slice(0, end + 1)
  }
  return v.replace(/\s+#.*$/, '').trim()
}

export function parseRoutine(name: string, text: string): Routine {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) throw new Error(`nome "${name}" deve ser kebab-case (ex.: resumo-manha)`)
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n([\s\S]*))?$/)
  if (!m) throw new Error('falta o cabeçalho entre linhas --- no início do ficheiro')
  const fields: Record<string, string> = {}
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const kv = line.match(/^([a-z_]+)\s*:\s*(.*)$/)
    if (!kv) throw new Error(`linha inválida no cabeçalho: "${line}"`)
    fields[kv[1]] = unquote(stripComment(kv[2].trim()))
  }
  const known = new Set(['schedule', 'mode', 'enabled', 'timeout_min', 'allow_tools'])
  for (const k of Object.keys(fields)) if (!known.has(k)) throw new Error(`campo desconhecido "${k}"`)

  if (!fields.schedule) throw new Error('falta "schedule"')
  const cron = parseCron(fields.schedule)

  const mode = (fields.mode || 'always') as Routine['mode']
  if (mode !== 'always' && mode !== 'only-if-relevant') throw new Error(`mode "${mode}" inválido (always ou only-if-relevant)`)

  const enabledRaw = (fields.enabled ?? 'true').toLowerCase()
  if (enabledRaw !== 'true' && enabledRaw !== 'false') throw new Error(`enabled tem de ser true ou false`)

  const timeoutMin = fields.timeout_min ? Number(fields.timeout_min) : 5
  if (!Number.isInteger(timeoutMin) || timeoutMin < 1 || timeoutMin > 60) throw new Error('timeout_min tem de ser um inteiro entre 1 e 60')

  const allowTools = (fields.allow_tools ?? '')
    .replace(/^\[|\]$/g, '')
    .split(/[\s,]+/)
    .map((s) => unquote(s.trim()))
    .filter(Boolean)

  const body = (m[2] ?? '').trim()
  if (!body) throw new Error('as instruções da rotina (depois do cabeçalho) estão vazias')

  return { name, schedule: fields.schedule, cron, mode, enabled: enabledRaw === 'true', timeoutMin, allowTools, body }
}

export type Due = { due: false } | { due: true; late: boolean }

/**
 * Uma rotina está devida se o cron coincide com este minuto, ou se perdeu uma
 * execução desde a última vez (máquina desligada) — nesse caso recupera UMA vez, como "atrasada".
 */
export function routineDue(cron: Cron, lastRun: Date | undefined, now: Date): Due {
  const minute = floorToMinute(now)
  if (lastRun && lastRun.getTime() >= minute.getTime()) return { due: false }
  if (matches(cron, minute)) return { due: true, late: false }
  if (!lastRun) return { due: false }
  const prev = prevRun(cron, minute)
  if (prev && prev.getTime() > lastRun.getTime()) return { due: true, late: true }
  return { due: false }
}
