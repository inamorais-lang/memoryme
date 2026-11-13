import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

export function writeJsonAtomic(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`
  writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n')
  renameSync(tmp, path)
}

const pad = (n: number) => String(n).padStart(2, '0')
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

/** Acrescenta "- HH:MM texto" a memory/log/AAAA-MM-DD.md */
export function appendLog(root: string, now: Date, text: string): void {
  const file = join(root, 'memory', 'log', `${ymd(now)}.md`)
  mkdirSync(dirname(file), { recursive: true })
  if (!existsSync(file)) writeFileSync(file, `# ${ymd(now)}\n\n`)
  appendFileSync(file, `- ${hm(now)} ${text.replace(/\s*\n\s*/g, ' ').slice(0, 300)}\n`)
}

export function formatWhen(d: Date): string {
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function shortReason(s: string): string {
  const line = s.trim().split(/\r?\n/).find((l) => l.trim()) ?? ''
  return line.length > 200 ? line.slice(0, 199) + '…' : line || 'sem detalhes'
}

// ---------- lock ----------

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (e: any) {
    return e?.code === 'EPERM'
  }
}

/** Tenta obter o lock; limpa locks abandonados (processo morto ou mais velho que staleMs). */
export function acquireLock(path: string, staleMs: number, now = Date.now()): boolean {
  mkdirSync(dirname(path), { recursive: true })
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      writeFileSync(path, JSON.stringify({ pid: process.pid, at: now }), { flag: 'wx' })
      return true
    } catch (e: any) {
      if (e?.code !== 'EEXIST') throw e
      let info: { pid?: number; at?: number } = {}
      try {
        info = JSON.parse(readFileSync(path, 'utf8'))
      } catch {}
      const stale = !info.pid || !pidAlive(info.pid) || !info.at || now - info.at > staleMs
      if (!stale) return false
      try {
        unlinkSync(path)
      } catch {}
    }
  }
  return false
}

export function releaseLock(path: string): void {
  try {
    unlinkSync(path)
  } catch {}
}
