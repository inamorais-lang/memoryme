// Run: deno test supabase/functions/_shared
import assert from 'node:assert/strict';

import { checkTransaction } from './purchases.ts';

const user = '38b8aa57-7f7b-4c2b-87a2-9f50be215596';
const ok = {
  transactionId: '2000001',
  originalTransactionId: '2000001',
  bundleId: 'app.petbubble',
  productId: 'app.petbubble.credits.5',
  type: 'Consumable',
  appAccountToken: user.toUpperCase(),
  purchaseDate: Date.parse('2026-11-11T10:00:00Z'),
  environment: 'Sandbox',
};

Deno.test('purchase: a valid consumable for this user and app passes', () => {
  assert.deepEqual(checkTransaction(ok, user, 'app.petbubble'), {
    transactionId: '2000001',
    originalTransactionId: '2000001',
    productId: 'app.petbubble.credits.5',
    environment: 'Sandbox',
    purchasedAt: '2026-11-11T10:00:00.000Z',
  });
});

Deno.test('purchase: refuses another app, another account, refunds and subscriptions', () => {
  assert.throws(() => checkTransaction({ ...ok, bundleId: 'com.other' }, user, 'app.petbubble'), /wrong_app/);
  assert.throws(() => checkTransaction({ ...ok, appAccountToken: 'someone-else' }, user, 'app.petbubble'), /wrong_account/);
  assert.throws(() => checkTransaction({ ...ok, appAccountToken: undefined }, user, 'app.petbubble'), /wrong_account/);
  assert.throws(() => checkTransaction({ ...ok, revocationDate: Date.now() }, user, 'app.petbubble'), /revoked/);
  assert.throws(() => checkTransaction({ ...ok, type: 'Auto-Renewable Subscription' }, user, 'app.petbubble'), /not_consumable/);
});

Deno.test('purchase: a voucher (Apple offer code) has no account token and still passes', () => {
  const voucher = { ...ok, productId: 'app.petbubble.credits.2', appAccountToken: undefined, offerType: 3 };
  assert.equal(checkTransaction(voucher, user, 'app.petbubble').productId, 'app.petbubble.credits.2');
  // Without the offer-code mark, a missing token is still refused.
  assert.throws(() => checkTransaction({ ...ok, appAccountToken: undefined }, user, 'app.petbubble'), /wrong_account/);
  // A voucher bought for another account (token present) is still refused.
  assert.throws(() => checkTransaction({ ...ok, offerType: 3, appAccountToken: 'someone-else' }, user, 'app.petbubble'), /wrong_account/);
});
