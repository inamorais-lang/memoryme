// Web (and anything without StoreKit): no purchases.
import type { CreditStore } from './types';

export const creditStore: CreditStore = {
  available: false,
  async prices() {
    return {};
  },
  async buy() {
    throw new Error('store_unavailable');
  },
  async restore() {
    return 0;
  },
};
