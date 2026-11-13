// Cron de 5 campos (minuto hora dia-do-mês mês dia-da-semana), em hora local.
// Suporta *, listas (1,2), intervalos (1-5), passos (*/15, 1-30/5) e domingo como 0 ou 7.
// Como no cron clássico: se dia-do-mês E dia-da-semana estiverem restritos, basta um coincidir.

export type Cron = {
  source: string
  minute: Set<number>
  hour: Set<number>
  dom: Set<number>
  month: Set<number>
  dow: Set<number>
  domStar: boolean
  dowStar: boolean
}

const FIELDS: [string, number, number][] = [
  ['minuto', 0, 59],
  ['hora', 0, 23],
  ['dia do mês', 1, 31],
  ['mês', 1, 12],
  ['dia da semana', 0, 7],
]

function toInt(s: string, field: string): number {
  if (!/^\d+$/.test(s)) throw new Error(`valor inválido "${s}" no campo ${field}`)
  return Number(s)
}

function parseField(text: string, [name, min, max]: [string, number, number]): Set<number> {
  const out = new Set<number>()
  for (const part of text.split(',')) {
    if (part === '') throw new Error(`lista vazia no campo ${name}`)
    const [range, stepText, extra] = part.split('/')
    if (extra !== undefined) throw new Error(`passo inválido "${part}" no campo ${name}`)
    const step = stepText === undefined ? 1 : toInt(stepText, name)
    if (step < 1) throw new Error(`passo tem de ser ≥ 1 no campo ${name}`)
    let lo: number
    let hi: number
    if (range === '*') {
      lo = min
      hi = max
    } else if (range.includes('-')) {
      const [a, b] = range.split('-')
      lo = toInt(a, name)
      hi = toInt(b, name)
    } else {
      lo = toInt(range, name)
      hi = stepText === undefined ? lo : max
    }
    if (lo < min || hi > max || lo > hi) throw new Error(`"${part}" fora do intervalo ${min}-${max} no campo ${name}`)
    for (let v = lo; v <= hi; v += step) out.add(v)
  }
  return out
}

export function parseCron(expr: string): Cron {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) throw new Error(`cron precisa de 5 campos, tem ${parts.length}: "${expr}"`)
  const [minute, hour, dom, month, dowRaw] = parts.map((p, i) => parseField(p, FIELDS[i]))
  const dow = new Set([...dowRaw].map((d) => (d === 7 ? 0 : d)))
  return {
    source: expr.trim(),
    minute,
    hour,
    dom,
    month,
    dow,
    domStar: parts[2] === '*',
    dowStar: parts[4] === '*',
  }
}

function dayMatches(c: Cron, d: Date): boolean {
  const domOk = c.dom.has(d.getDate())
  const dowOk = c.dow.has(d.getDay())
  if (c.domStar && c.dowStar) return true
  if (c.domStar) return dowOk
  if (c.dowStar) return domOk
  return domOk || dowOk
}

export function matches(c: Cron, d: Date): boolean {
  return (
    c.minute.has(d.getMinutes()) &&
    c.hour.has(d.getHours()) &&
    c.month.has(d.getMonth() + 1) &&
    dayMatches(c, d)
  )
}

export function floorToMinute(d: Date): Date {
  const x = new Date(d)
  x.setSeconds(0, 0)
  return x
}

/** Próxima execução estritamente depois de `after`. */
export function nextRun(c: Cron, after: Date, maxDays = 400): Date | null {
  const d = floorToMinute(after)
  d.setMinutes(d.getMinutes() + 1)
  const limit = after.getTime() + maxDays * 86400_000
  while (d.getTime() <= limit) {
    if (!c.month.has(d.getMonth() + 1) || !dayMatches(c, d)) {
      d.setDate(d.getDate() + 1)
      d.setHours(0, 0, 0, 0)
      continue
    }
    if (!c.hour.has(d.getHours())) {
      d.setHours(d.getHours() + 1, 0, 0, 0)
      continue
    }
    if (c.minute.has(d.getMinutes())) return d
    d.setMinutes(d.getMinutes() + 1)
  }
  return null
}

/** Última execução estritamente antes de `before`, procurando até `maxDays` para trás. */
export function prevRun(c: Cron, before: Date, maxDays = 35): Date | null {
  const d = floorToMinute(before)
  if (d.getTime() >= before.getTime()) d.setMinutes(d.getMinutes() - 1)
  const limit = before.getTime() - maxDays * 86400_000
  while (d.getTime() >= limit) {
    if (!c.month.has(d.getMonth() + 1) || !dayMatches(c, d)) {
      d.setHours(0, 0, 0, 0)
      d.setMinutes(-1) // 23:59 do dia anterior
      continue
    }
    if (!c.hour.has(d.getHours())) {
      d.setMinutes(0, 0, 0)
      d.setMinutes(-1) // :59 da hora anterior
      continue
    }
    if (c.minute.has(d.getMinutes())) return d
    d.setMinutes(d.getMinutes() - 1)
  }
  return null
}
