// Só ENVIA mensagens (Bot API sendMessage). Nunca recebe, para não competir com o plugin.

export const TELEGRAM_LIMIT = 4096

export function splitMessage(text: string, limit = 4000): string[] {
  const out: string[] = []
  let rest = text
  while (rest.length > limit) {
    let cut = rest.lastIndexOf('\n', limit)
    if (cut < limit / 2) cut = rest.lastIndexOf(' ', limit)
    if (cut < limit / 2) cut = limit
    out.push(rest.slice(0, cut).trimEnd())
    rest = rest.slice(cut).trimStart()
  }
  if (rest) out.push(rest)
  return out
}

export type Sender = (text: string) => Promise<void>

export function telegramSender(token: string, chatId: string, timeoutMs = 15_000): Sender {
  return async (text: string) => {
    if (!token) throw new Error('token do bot não encontrado (~/.claude/channels/telegram/.env)')
    if (!chatId) throw new Error('TELEGRAM_CHAT_ID não definido em .env.local')
    for (const chunk of splitMessage(text)) {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: chunk, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Telegram ${res.status}: ${body.slice(0, 200)}`)
      }
    }
  }
}
