// iOS: StoreKit 2 through expo-iap. Every transaction is checked by our server
// before it is finished, so credits are never added without Apple's signature.
import Constants, { ExecutionEnvironment } from 'expo-constants';

import type { CreditStore, PurchaseOutcome, VerifyPurchase } from './types';

// Expo Go has no StoreKit module: loading expo-iap there would crash.
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type Iap = typeof import('expo-iap');
let iap: Iap | null = null;
let connected: Promise<unknown> | null = null;
// While a purchase is on screen its own listener settles it; restore must not race it.
let buying = false;

async function store(): Promise<Iap> {
  if (!iap) iap = (await import('expo-iap')) as Iap;
  if (!connected) connected = iap.initConnection().catch((e: unknown) => ((connected = null), Promise.reject(e)));
  await connected;
  return iap;
}

async function settle(
  lib: Iap,
  purchase: { productId: string; purchaseToken?: string | null },
  verify: VerifyPurchase,
): Promise<number> {
  if (!purchase.purchaseToken) throw new Error('purchase_unsigned');
  const { creditsAdded } = await verify(purchase.purchaseToken);
  // Only after the server has the transaction: an unfinished one comes back on restore.
  await lib.finishTransaction({ purchase: purchase as Parameters<Iap['finishTransaction']>[0]['purchase'], isConsumable: true });
  return creditsAdded;
}

export const creditStore: CreditStore = {
  available: !inExpoGo,

  async prices(productIds) {
    if (inExpoGo) return {};
    const lib = await store();
    const products = (await lib.fetchProducts({ skus: productIds, type: 'in-app' })) ?? [];
    const out: Record<string, string> = {};
    for (const p of products as { id: string; displayPrice: string }[]) out[p.id] = p.displayPrice;
    return out;
  },

  async buy(productId, userId, verify) {
    if (inExpoGo) throw new Error('store_unavailable');
    const lib = await store();
    buying = true;
    return new Promise<PurchaseOutcome>((resolve, reject) => {
      let done = false;
      const finish = (fn: () => void) => {
        if (done) return;
        done = true;
        buying = false;
        okSub.remove();
        errSub.remove();
        fn();
      };
      const okSub = lib.purchaseUpdatedListener((purchase) => {
        if (purchase.productId !== productId) return;
        if (purchase.purchaseState === 'pending') return finish(() => resolve({ status: 'pending' }));
        settle(lib, purchase, verify).then(
          (creditsAdded) => finish(() => resolve({ status: 'purchased', creditsAdded })),
          (e) => finish(() => reject(e)),
        );
      });
      const errSub = lib.purchaseErrorListener((error) => {
        if (error.productId && error.productId !== productId) return;
        finish(() =>
          error.code === lib.ErrorCode.UserCancelled ? resolve({ status: 'cancelled' }) : reject(new Error('purchase_failed')),
        );
      });
      lib
        .requestPurchase({ type: 'in-app', request: { apple: { sku: productId, appAccountToken: userId } } })
        .catch(() => finish(() => reject(new Error('purchase_failed'))));
    });
  },

  async restore(verify) {
    if (inExpoGo || buying) return 0;
    const lib = await store();
    const purchases = await lib.getAvailablePurchases();
    let added = 0;
    for (const p of purchases ?? []) {
      if (!p.productId.startsWith('app.petbubble.credits.') || p.purchaseState === 'pending') continue;
      added += await settle(lib, p, verify).catch(() => 0);
    }
    return added;
  },

  async redeemCode() {
    if (inExpoGo) throw new Error('store_unavailable');
    const lib = await store();
    await lib.openRedeemOfferCode();
  },
};
