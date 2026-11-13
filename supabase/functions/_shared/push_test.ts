import assert from 'node:assert/strict';

import { readyMessage, reminderMessage, sendPush } from './push.ts';

Deno.test('push texts follow the language, English otherwise', () => {
  assert.deepEqual(readyMessage('t', 'pt-PT', 'g').title, '🐾 A tua imagem está pronta!');
  assert.deepEqual(readyMessage('t', 'de', 'g').title, '🐾 Your picture is ready!');
  assert.deepEqual(readyMessage('t', 'fr', 'g').data, { generationId: 'g' });
  assert.deepEqual(reminderMessage('t', 'pt-PT', 1).body, 'Tens 1 crédito. Que tal um modo novo hoje?');
  assert.deepEqual(reminderMessage('t', 'es', 3).body, 'Tienes 3 créditos. ¿Un modo nuevo hoy?');
});

Deno.test('sendPush counts accepted messages and reports removed devices', async () => {
  const fake = (async () =>
    new Response(JSON.stringify({ data: [{ status: 'ok' }, { status: 'error', details: { error: 'DeviceNotRegistered' } }] }))) as typeof fetch;
  const result = await sendPush([readyMessage('a', 'en', 'g'), readyMessage('b', 'en', 'g')], fake);
  assert.deepEqual(result, { sent: 1, dead: ['b'] });
});
