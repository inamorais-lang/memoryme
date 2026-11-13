import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildArgs, runRoutine, spawnClaude, type ClaudeResult } from '../src/runner'
import { parseRoutine } from '../src/routines'
import { splitMessage } from '../src/telegram'
import { flushOutbox, paths, runDueRoutines, tick, type Deps } from '../src/tick'
import { acquireLock, releaseLock } from '../src/util'

let root: string
let sent: string[]
let failSend: boolean
let clock: Date
let claudeCalls: string[][]
let claudeResult: ClaudeResult

function deps(extra: Partial<Deps> = {}): Deps {
  return {
    root,
    now: () => new Date(clock),
    send: async (t) => {
      if (failSend) throw new Error('rede em baixo')
      sent.push(t)
    },
    runClaude: async (args) => {
      claudeCalls.push(args)
      return claudeResult
    },
    ...extra,
  }
}

const writeReminders = (v: unknown) => writeFileSync(paths(root).reminders, JSON.stringify(v))
const readReminders = () => JSON.parse(readFileSync(paths(root).reminders, 'utf8'))
const writeRoutine = (name: string, text: string) => writeFileSync(join(paths(root).routines, `${name}.md`), text)

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'assistente-'))
  mkdirSync(paths(root).routines, { recursive: true })
  writeReminders([])
  sent = []
  failSend = false
  clock = new Date('2026-11-13T10:00:00')
  claudeCalls = []
  claudeResult = { code: 0, stdout: 'Olá!', stderr: '', timedOut: false }
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

describe('lembretes', () => {
  test('envia os devidos, remove-os e mantém os outros', async () => {
    writeReminders([
      { id: 'r_0001', at: '2026-11-13T09:58:00+00:00', text: 'alongar' },
      { id: 'r_0002', at: '2026-11-14T09:00:00+00:00', text: 'amanhã' },
    ])
    await tick(deps())
    expect(sent).toEqual(['⏰ alongar'])
    expect(readReminders().map((r: any) => r.id)).toEqual(['r_0002'])
    const log = readFileSync(join(root, 'memory', 'log', '2026-11-13.md'), 'utf8')
    expect(log).toContain('lembrete enviado: alongar')
  })
  test('marca como atrasado se passou mais de 5 min', async () => {
    writeReminders([{ id: 'r_1', at: '2026-11-13T09:00:00+00:00', text: 'ligar' }])
    await tick(deps())
    expect(sent).toEqual(['⏰ ligar (atrasado)'])
  })
  test('JSON inválido é reportado uma só vez', async () => {
    writeFileSync(paths(root).reminders, '[{oops')
    await tick(deps())
    await tick(deps())
    expect(sent.length).toBe(1)
    expect(sent[0]).toContain('reminders.json inválido')
  })
})

describe('fila de reenvio', () => {
  test('falha → fila → reenvia no tick seguinte', async () => {
    writeReminders([{ id: 'r_1', at: '2026-11-13T09:59:00+00:00', text: 'x' }])
    failSend = true
    await tick(deps())
    expect(readReminders()).toEqual([])
    expect(readdirSync(paths(root).outbox).length).toBe(1)
    failSend = false
    await tick(deps())
    expect(sent).toEqual(['⏰ x'])
    expect(readdirSync(paths(root).outbox).length).toBe(0)
  })
  test('desiste ao fim de 3 tentativas', async () => {
    failSend = true
    await deps().send('a').catch(() => {})
    const { enqueue } = await import('../src/tick')
    enqueue(root, 'msg', clock)
    for (let i = 0; i < 3; i++) await flushOutbox(deps())
    expect(readdirSync(paths(root).outbox).length).toBe(0)
  })
})

describe('saúde', () => {
  test('alerta uma vez após 3 falhas e avisa na recuperação', async () => {
    let ok = false
    const d = deps({ health: async () => ({ ok, problems: ['sessão parada'] }) })
    for (let i = 0; i < 5; i++) await tick(d)
    expect(sent).toEqual(['🔴 Assistente com problemas:\n- sessão parada'])
    ok = true
    await tick(d)
    await tick(d)
    expect(sent[1]).toBe('✅ Assistente recuperado.')
    expect(sent.length).toBe(2)
  })
})

describe('rotinas', () => {
  const routine = (extra = '') => `---\nschedule: "0 10 * * *"\n${extra}---\nDiz olá.`

  test('corre na hora e envia com o nome', async () => {
    writeRoutine('ola', routine())
    await runDueRoutines(deps())
    expect(sent).toEqual(['[ola] Olá!'])
    await runDueRoutines(deps()) // mesmo minuto → não repete
    expect(claudeCalls.length).toBe(1)
  })
  test('NOTHING não envia nada', async () => {
    writeRoutine('ola', routine('mode: only-if-relevant\n'))
    claudeResult = { code: 0, stdout: 'NOTHING\n', stderr: '', timedOut: false }
    await runDueRoutines(deps())
    expect(sent).toEqual([])
    expect(claudeCalls[0][1]).toContain('responde exatamente NOTHING')
  })
  test('pausada não corre e não recupera ao reativar', async () => {
    writeRoutine('ola', routine('enabled: false\n'))
    await runDueRoutines(deps())
    clock = new Date('2026-11-13T12:00:00')
    writeRoutine('ola', routine())
    await runDueRoutines(deps())
    expect(claudeCalls.length).toBe(0)
  })
  test('recupera uma execução perdida como atrasada', async () => {
    writeRoutine('ola', routine())
    clock = new Date('2026-11-13T09:00:00')
    await runDueRoutines(deps()) // regista referência
    clock = new Date('2026-11-13T11:30:00') // desligado às 10:00
    await runDueRoutines(deps())
    await runDueRoutines(deps())
    expect(sent).toEqual(['[ola · atrasada] Olá!'])
  })
  test('erro do claude → ⚠️ sem LLM', async () => {
    writeRoutine('ola', routine())
    claudeResult = { code: 1, stdout: '', stderr: 'Usage limit reached\nmais detalhes', timedOut: false }
    await runDueRoutines(deps())
    expect(sent).toEqual(['⚠️ ola falhou: Usage limit reached'])
  })
  test('timeout → ⚠️', async () => {
    writeRoutine('ola', routine())
    claudeResult = { code: null, stdout: '', stderr: '', timedOut: true }
    await runDueRoutines(deps())
    expect(sent).toEqual(['⚠️ ola falhou: passou do limite de 5 min'])
  })
  test('ficheiro inválido reportado uma vez por alteração', async () => {
    writeRoutine('mau', '---\nschedule: 99 * * * *\n---\nx')
    await runDueRoutines(deps())
    await runDueRoutines(deps())
    expect(sent.length).toBe(1)
    expect(sent[0]).toContain('mau.md')
    writeRoutine('mau', '---\nschedule: 98 * * * *\n---\nx')
    await runDueRoutines(deps())
    expect(sent.length).toBe(2)
  })
  test('não corre se outro processo tem o lock', async () => {
    writeRoutine('ola', routine())
    mkdirSync(paths(root).state, { recursive: true })
    writeFileSync(paths(root).routineLock, JSON.stringify({ pid: process.pid, at: Date.now() }))
    await runDueRoutines(deps())
    expect(claudeCalls.length).toBe(0)
  })
})

describe('runner', () => {
  test('argumentos: só leitura, plugin desligado, allow_tools respeitado', () => {
    mkdirSync(join(root, '.claude'))
    writeFileSync(
      join(root, '.claude', 'settings.json'),
      JSON.stringify({ permissions: { allow: ['mcp__cal__list_events', 'mcp__cal__create_event', 'mcp__mail__send_email'] } }),
    )
    const r = parseRoutine('x', '---\nschedule: 0 9 * * *\nallow_tools: mcp__cal__create_event\n---\nfaz')
    const args = buildArgs(r, root)
    expect(args).toContain('Edit')
    expect(args).toContain('Bash(git commit:*)')
    expect(args).toContain('mcp__mail__send_email')
    expect(args).not.toContain('mcp__cal__list_events')
    expect(args.slice(args.indexOf('--allowedTools'))).toEqual(['--allowedTools', 'mcp__cal__create_event'])
    expect(args.filter((a) => a === 'mcp__cal__create_event').length).toBe(1)
    expect(args[args.indexOf('--settings') + 1]).toBe('{"enabledPlugins":{"telegram@claude-plugins-official":false}}')
  })
  test('mata o processo no timeout', async () => {
    const fake = join(root, 'fake-claude')
    writeFileSync(fake, '#!/bin/sh\nsleep 10\n')
    chmodSync(fake, 0o755)
    process.env.CLAUDE_BIN = fake
    const t0 = Date.now()
    const res = await spawnClaude(['-p', 'x'], { cwd: root, timeoutMs: 300 })
    delete process.env.CLAUDE_BIN
    expect(res.timedOut).toBe(true)
    expect(Date.now() - t0).toBeLessThan(3000)
  })
  test('passa o texto do claude falso', async () => {
    const fake = join(root, 'fake-claude')
    writeFileSync(fake, '#!/bin/sh\necho "resultado"\n')
    chmodSync(fake, 0o755)
    process.env.CLAUDE_BIN = fake
    const r = parseRoutine('y', '---\nschedule: 0 9 * * *\n---\nfaz')
    const out = await runRoutine(r, root, spawnClaude)
    delete process.env.CLAUDE_BIN
    expect(out.message).toBe('[y] resultado')
  })
})

describe('utilitários', () => {
  test('divide mensagens longas abaixo do limite do Telegram', () => {
    const text = Array.from({ length: 500 }, (_, i) => `linha ${i} ${'x'.repeat(20)}`).join('\n')
    const parts = splitMessage(text)
    expect(parts.length).toBeGreaterThan(1)
    expect(parts.every((p) => p.length <= 4000)).toBe(true)
    expect(parts.join('\n')).toBe(text)
  })
  test('lock: exclusivo e limpa locks abandonados', () => {
    const p = join(root, 'state', 'x.lock')
    expect(acquireLock(p, 60_000)).toBe(true)
    expect(acquireLock(p, 60_000)).toBe(false)
    releaseLock(p)
    writeFileSync(p, JSON.stringify({ pid: 999999, at: Date.now() })) // processo inexistente
    expect(acquireLock(p, 60_000)).toBe(true)
    releaseLock(p)
    writeFileSync(p, JSON.stringify({ pid: process.pid, at: Date.now() - 120_000 })) // velho
    expect(acquireLock(p, 60_000)).toBe(true)
    expect(existsSync(p)).toBe(true)
  })
})
