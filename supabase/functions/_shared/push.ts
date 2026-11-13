// Push notifications through Expo's push service (it holds the Apple push key; no secret here).
export type Lang = 'pt-PT' | 'en' | 'es' | 'fr';
export type PushMessage = { to: string; title: string; body: string; data?: Record<string, unknown> };

const TEXTS: Record<Lang, { readyTitle: string; readyBody: string; remindTitle: string; remindBody: (n: number) => string }> = {
  'pt-PT': {
    readyTitle: '🐾 A tua imagem está pronta!',
    readyBody: 'Vem ver o que o teu patudo está a pensar.',
    remindTitle: 'O teu patudo está à espera 🐶',
    remindBody: (n) => `Tens ${n} ${n === 1 ? 'crédito' : 'créditos'}. Que tal um modo novo hoje?`,
  },
  en: {
    readyTitle: '🐾 Your picture is ready!',
    readyBody: 'Come and see what your pet is thinking.',
    remindTitle: 'Your pet is waiting 🐶',
    remindBody: (n) => `You have ${n} ${n === 1 ? 'credit' : 'credits'} left. Try a new mode today?`,
  },
  es: {
    readyTitle: '🐾 ¡Tu imagen está lista!',
    readyBody: 'Ven a ver qué está pensando tu mascota.',
    remindTitle: 'Tu mascota te espera 🐶',
    remindBody: (n) => `Tienes ${n} ${n === 1 ? 'crédito' : 'créditos'}. ¿Un modo nuevo hoy?`,
  },
  fr: {
    readyTitle: '🐾 Ton image est prête !',
    readyBody: 'Viens voir à quoi pense ton compagnon.',
    remindTitle: 'Ton compagnon t’attend 🐶',
    remindBody: (n) => `Il te reste ${n} ${n === 1 ? 'crédit' : 'crédits'}. Un nouveau mode aujourd’hui ?`,
  },
};

export function lang(value: string | null | undefined): Lang {
  return value === 'pt-PT' || value === 'es' || value === 'fr' ? value : 'en';
}

export function readyMessage(to: string, language: string, generationId: string): PushMessage {
  const t = TEXTS[lang(language)];
  return { to, title: t.readyTitle, body: t.readyBody, data: { generationId } };
}

export function reminderMessage(to: string, language: string, credits: number): PushMessage {
  const t = TEXTS[lang(language)];
  return { to, title: t.remindTitle, body: t.remindBody(credits) };
}

/**
 * Sends in batches of 100. Returns how many were accepted and the tokens Apple no longer
 * accepts (the app was removed), so the caller can drop them.
 */
export async function sendPush(messages: PushMessage[], fetcher: typeof fetch = fetch): Promise<{ sent: number; dead: string[] }> {
  let sent = 0;
  const dead: string[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100).map((m) => ({ ...m, sound: 'default' }));
    try {
      const res = await fetcher('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        console.error('push batch', res.status);
        continue;
      }
      const { data } = (await res.json()) as { data?: { status: string; details?: { error?: string } }[] };
      (data ?? []).forEach((ticket, j) => {
        if (ticket.status === 'ok') sent++;
        else if (ticket.details?.error === 'DeviceNotRegistered') dead.push(batch[j].to);
      });
    } catch (e) {
      console.error('push batch', e);
    }
  }
  return { sent, dead };
}
