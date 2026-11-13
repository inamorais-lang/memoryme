import { describe, expect, test } from 'bun:test'
import { matches, nextRun, parseCron, prevRun } from '../src/cron'
import { parseRoutine, routineDue } from '../src/routines'

// Os testes correm com TZ=Europe/Lisbon (ver package.json). Datas locais:
const at = (s: string) => new Date(s) // "2026-11-13T08:30:00" sem offset = hora local

describe('parseCron', () => {
  test('intervalos, passos e listas', () => {
    const c = parseCron('*/15 8-10 * * 1,3,5')
    expect([...c.minute]).toEqual([0, 15, 30, 45])
    expect([...c.hour]).toEqual([8, 9, 10])
    expect([...c.dow]).toEqual([1, 3, 5])
  })
  test('passo dentro de intervalo e valor com passo', () => {
    expect([...parseCron('10-30/10 * * * *').minute]).toEqual([10, 20, 30])
    expect([...parseCron('50/5 * * * *').minute]).toEqual([50, 55])
  })
  test('domingo como 0 ou 7', () => {
    const sun = at('2026-11-15T09:00:00') // domingo
    expect(matches(parseCron('0 9 * * 0'), sun)).toBe(true)
    expect(matches(parseCron('0 9 * * 7'), sun)).toBe(true)
    expect(matches(parseCron('0 9 * * 1-5'), sun)).toBe(false)
  })
  test('dia do mês OU dia da semana quando ambos restritos', () => {
    const c = parseCron('0 9 1 * 1') // dia 1 OU segunda
    expect(matches(c, at('2026-11-16T09:00:00'))).toBe(true) // segunda, dia 16
    expect(matches(c, at('2026-12-01T09:00:00'))).toBe(true) // terça, dia 1
    expect(matches(c, at('2026-11-17T09:00:00'))).toBe(false)
  })
  test('só dia do mês restrito', () => {
    const c = parseCron('0 9 13 * *')
    expect(matches(c, at('2026-11-13T09:00:00'))).toBe(true)
    expect(matches(c, at('2026-11-14T09:00:00'))).toBe(false)
  })
  test('erros', () => {
    expect(() => parseCron('* * * *')).toThrow()
    expect(() => parseCron('60 * * * *')).toThrow()
    expect(() => parseCron('*/0 * * * *')).toThrow()
    expect(() => parseCron('a * * * *')).toThrow()
    expect(() => parseCron('5-1 * * * *')).toThrow()
  })
})

describe('nextRun / prevRun', () => {
  test('próxima execução em dia útil', () => {
    const c = parseCron('30 8 * * 1-5')
    const n = nextRun(c, at('2026-11-13T09:00:00'))! // sexta 09:00
    expect(n.toString()).toBe(at('2026-11-16T08:30:00').toString()) // segunda
  })
  test('anterior estritamente antes', () => {
    const c = parseCron('30 8 * * *')
    expect(prevRun(c, at('2026-11-13T08:30:00'))!.getTime()).toBe(at('2026-11-12T08:30:00').getTime())
    expect(prevRun(c, at('2026-11-13T08:31:00'))!.getTime()).toBe(at('2026-11-13T08:30:00').getTime())
  })
})

describe('routineDue', () => {
  const c = parseCron('30 8 * * *')
  test('na hora certa', () => {
    expect(routineDue(c, at('2026-11-12T08:30:00'), at('2026-11-13T08:30:20'))).toEqual({ due: true, late: false })
  })
  test('não repete no mesmo minuto', () => {
    expect(routineDue(c, at('2026-11-13T08:30:05'), at('2026-11-13T08:30:40'))).toEqual({ due: false })
  })
  test('recupera uma vez, como atrasada', () => {
    // estava desligado das 08:00 às 10:00
    expect(routineDue(c, at('2026-11-13T08:00:00'), at('2026-11-13T10:00:00'))).toEqual({ due: true, late: true })
    // depois de recuperar, não volta a correr
    expect(routineDue(c, at('2026-11-13T10:00:00'), at('2026-11-13T10:01:00'))).toEqual({ due: false })
  })
  test('vários dias perdidos → uma única recuperação', () => {
    const r = routineDue(c, at('2026-11-01T09:00:00'), at('2026-11-13T10:00:00'))
    expect(r).toEqual({ due: true, late: true })
    expect(routineDue(c, at('2026-11-13T10:00:00'), at('2026-11-13T10:01:00'))).toEqual({ due: false })
  })
  test('rotina nova sem histórico não recupera', () => {
    expect(routineDue(c, undefined, at('2026-11-13T10:00:00'))).toEqual({ due: false })
    expect(routineDue(c, undefined, at('2026-11-13T08:30:00'))).toEqual({ due: true, late: false })
  })
})

describe('parseRoutine', () => {
  const ok = `---
schedule: "30 8 * * 1-5"   # dias úteis
mode: only-if-relevant
enabled: false
timeout_min: 10
allow_tools: mcp__x__create_draft, mcp__y__send
---
Resume as pendências.`
  test('lê o cabeçalho', () => {
    const r = parseRoutine('resumo-manha', ok)
    expect(r.schedule).toBe('30 8 * * 1-5')
    expect(r.mode).toBe('only-if-relevant')
    expect(r.enabled).toBe(false)
    expect(r.timeoutMin).toBe(10)
    expect(r.allowTools).toEqual(['mcp__x__create_draft', 'mcp__y__send'])
    expect(r.body).toBe('Resume as pendências.')
  })
  test('valores por omissão', () => {
    const r = parseRoutine('a', '---\nschedule: 0 9 * * *\n---\nOlá')
    expect(r).toMatchObject({ mode: 'always', enabled: true, timeoutMin: 5, allowTools: [] })
  })
  test('erros claros, sem rebentar', () => {
    expect(() => parseRoutine('a', 'sem cabeçalho')).toThrow('cabeçalho')
    expect(() => parseRoutine('a', '---\nmode: always\n---\nx')).toThrow('schedule')
    expect(() => parseRoutine('a', '---\nschedule: 0 9 * * *\ntimeout_min: 90\n---\nx')).toThrow('timeout_min')
    expect(() => parseRoutine('a', '---\nschedule: 0 9 * * *\n---\n')).toThrow('vazias')
    expect(() => parseRoutine('a', '---\nschedule: 0 9 * * *\nfoo: 1\n---\nx')).toThrow('desconhecido')
    expect(() => parseRoutine('Mau_Nome', '---\nschedule: 0 9 * * *\n---\nx')).toThrow('kebab')
  })
})
