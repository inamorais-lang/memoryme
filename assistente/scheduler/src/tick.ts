import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseRoutine, routineDue, type Routine } from './routines'
import { runRoutine, type ClaudeRunner } from './runner'
import type { Sender } from './telegram'
import { acquireLock, appendLog, readJson, releaseLock, shortReason, writeJsonAtomic } from './util'

export type Reminder = { id: string; at: string; text: string; created?: string }
export type Health = { ok: boolean; problems: string[] }

export type Deps = {
  root: string
  now: () => Date
  send: Sender
  runClaude: ClaudeRunner
  health?: () => Promise<Health>
  warn?: (msg: string) => void
}

export const paths = (root: string) => ({
  reminders: join(root, 'schedules', 'reminders.json'),
  routines: join(root, 'schedules', 'routines'),
  state: join(root, 'state'),
  outbox: join(root, 'state', 'outbox'),
  tickState: join(root, 'state', 'tick.json'),
  routineState: join(root, 'state', 'routines.json'),
  tickLock: join(root, 'state', 'tick.lock'),
  routineLock: join(root, 'state', 'routines.lock'),
})

type TickState = {
  lastTick?: string
  badReminders?: string
  health?: { fails: number; alerted: boolean }
}
type RoutineState = { lastRun: Record<string, string>; badFiles: Record<string, string> }

const LATE_MS = 5 * 60_000
const MAX_RETRIES = 3

// ---------- envio com fila de reenvio ----------

type Queued = { text: string; attempts: number; created: string }

export function enqueue(root: string, text: string, now: Date): void {
  const dir = paths(root).outbox
  mkdirSync(dir, { recursive: true })
  const id = `${now.getTime()}-${Math.random().toString(16).slice(2, 8)}`
  writeFileSync(join(dir, `${id}.json`), JSON.stringify({ text, attempts: 0, created: now.toISOString() } satisfies Queued))
}

export async function sendOrQueue(deps: Deps, text: string): Promise<boolean> {
  try {
    await deps.send(text)
    return true
  } catch (e: any) {
    deps.warn?.(`envio falhou, fica na fila: ${e?.message ?? e}`)
    enqueue(deps.root, text, deps.now())
    return false
  }
}

export async function flushOutbox(deps: Deps): Promise<void> {
  const dir = paths(deps.root).outbox
  if (!existsSync(dir)) return
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const file = join(dir, f)
    let item: Queued
    try {
      item = JSON.parse(readFileSync(file, 'utf8'))
    } catch {
      unlinkSync(file)
      continue
    }
    try {
      await deps.send(item.text)
      unlinkSync(file)
    } catch (e: any) {
      item.attempts++
      if (item.attempts >= MAX_RETRIES) {
        unlinkSync(file)
        appendLog(deps.root, deps.now(), `⚠️ mensagem descartada após ${MAX_RETRIES} tentativas: ${item.text.slice(0, 80)}`)
      } else {
        writeFileSync(file, JSON.stringify(item))
      }
    }
  }
}

// ---------- lembretes ----------

export async function processReminders(deps: Deps, state: TickState): Promise<void> {
  const p = paths(deps.root).reminders
  let list: Reminder[]
  try {
    list = readJson<Reminder[]>(p, [])
    if (!Array.isArray(list)) throw new Error('não é uma lista JSON')
    state.badReminders = undefined
  } catch (e: any) {
    const sig = existsSync(p) ? hashFile(p) : 'missing'
    if (state.badReminders !== sig) {
      state.badReminders = sig
      await sendOrQueue(deps, `⚠️ schedules/reminders.json inválido: ${shortReason(e?.message ?? String(e))}`)
    }
    return
  }
  const now = deps.now()
  const due = list.filter((r) => {
    const t = Date.parse(r?.at)
    return Number.isFinite(t) && t <= now.getTime()
  })
  if (!due.length) return
  for (const r of due) {
    const late = now.getTime() - Date.parse(r.at) > LATE_MS
    await sendOrQueue(deps, `⏰ ${r.text}${late ? ' (atrasado)' : ''}`)
    appendLog(deps.root, now, `⏰ lembrete enviado: ${r.text}`)
  }
  // Relê antes de gravar para não apagar lembretes acrescentados entretanto.
  const sent = new Set(due.map((r) => r.id))
  const fresh = readJson<Reminder[]>(p, [])
  writeJsonAtomic(
    p,
    fresh.filter((r) => !(sent.has(r.id) && Date.parse(r.at) <= now.getTime())),
  )
}

// ---------- saúde ----------

async function checkHealth(deps: Deps, state: TickState): Promise<void> {
  if (!deps.health) return
  const h = await deps.health()
  const s = (state.health ??= { fails: 0, alerted: false })
  if (h.ok) {
    if (s.alerted) await sendOrQueue(deps, '✅ Assistente recuperado.')
    s.fails = 0
    s.alerted = false
    return
  }
  s.fails++
  if (s.fails >= 3 && !s.alerted) {
    s.alerted = true
    await sendOrQueue(deps, `🔴 Assistente com problemas:\n- ${h.problems.join('\n- ')}`)
  }
}

/** Tick rápido (a cada minuto): reenvios, lembretes, verificação de saúde. */
export async function tick(deps: Deps): Promise<void> {
  const P = paths(deps.root)
  if (!acquireLock(P.tickLock, 5 * 60_000)) return
  try {
    const state = readJson<TickState>(P.tickState, {})
    await flushOutbox(deps)
    await processReminders(deps, state)
    await checkHealth(deps, state)
    state.lastTick = deps.now().toISOString()
    writeJsonAtomic(P.tickState, state)
  } finally {
    releaseLock(P.tickLock)
  }
}

// ---------- rotinas ----------

function hashFile(path: string): string {
  return createHash('sha1').update(readFileSync(path, 'utf8')).digest('hex').slice(0, 12)
}

export type LoadedRoutine = { file: string; routine?: Routine; error?: string }

export function loadRoutines(root: string): LoadedRoutine[] {
  const dir = paths(root).routines
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && statSync(join(dir, f)).isFile())
    .sort()
    .map((file) => {
      try {
        return { file, routine: parseRoutine(file.replace(/\.md$/, ''), readFileSync(join(dir, file), 'utf8')) }
      } catch (e: any) {
        return { file, error: e?.message ?? String(e) }
      }
    })
}

/** Corre as rotinas devidas, uma de cada vez. */
export async function runDueRoutines(deps: Deps): Promise<void> {
  const P = paths(deps.root)
  if (!acquireLock(P.routineLock, 65 * 60_000)) return
  try {
    const state = readJson<RoutineState>(P.routineState, { lastRun: {}, badFiles: {} })
    state.badFiles ??= {}
    state.lastRun ??= {}
    const loaded = loadRoutines(deps.root)
    const save = () => writeJsonAtomic(P.routineState, state)

    for (const { file, error } of loaded) {
      if (!error) {
        delete state.badFiles[file]
        continue
      }
      const sig = hashFile(join(P.routines, file))
      if (state.badFiles[file] !== sig) {
        state.badFiles[file] = sig
        await sendOrQueue(deps, `⚠️ Rotina ${file} com erro: ${error}`)
      }
    }
    // Esquece ficheiros apagados.
    const names = new Set(loaded.map((l) => l.routine?.name).filter(Boolean))
    for (const k of Object.keys(state.lastRun)) if (!names.has(k)) delete state.lastRun[k]
    for (const k of Object.keys(state.badFiles)) if (!loaded.some((l) => l.file === k)) delete state.badFiles[k]
    save()

    for (const { routine } of loaded) {
      if (!routine) continue
      const now = deps.now()
      const last = state.lastRun[routine.name] ? new Date(state.lastRun[routine.name]) : undefined
      if (!routine.enabled) {
        // Pausada: avança a referência para não "recuperar" execuções antigas ao reativar.
        state.lastRun[routine.name] = now.toISOString()
        save()
        continue
      }
      const due = routineDue(routine.cron, last, now)
      if (!due.due) {
        if (!last) {
          state.lastRun[routine.name] = now.toISOString()
          save()
        }
        continue
      }
      state.lastRun[routine.name] = now.toISOString()
      save()
      const { message } = await runRoutine(routine, deps.root, deps.runClaude, due.late)
      if (message) {
        await sendOrQueue(deps, message)
        appendLog(deps.root, deps.now(), `rotina ${routine.name}: ${message}`)
      } else {
        appendLog(deps.root, deps.now(), `rotina ${routine.name}: nada a reportar`)
      }
    }
  } finally {
    releaseLock(P.routineLock)
  }
}
