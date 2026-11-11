/** A credits pack as sold in the App Store (productId app.petbubble.credits.N). */
export type StorePack = {
  productId: string;
  credits: number;
  /** Localised price from the App Store; missing when the store did not answer. */
  price?: string;
};

export type PurchaseOutcome =
  | { status: 'purchased'; creditsAdded: number }
  | { status: 'cancelled' }
  /** Waiting for approval (e.g. Ask to Buy); the credits arrive later through restore. */
  | { status: 'pending' };

/** Checks a signed App Store transaction on our server and adds its credits (once). */
export type VerifyPurchase = (signedTransaction: string) => Promise<{ creditsAdded: number }>;

export interface CreditStore {
  /** False on the web and in Expo Go: there is no StoreKit there. */
  available: boolean;
  /** Prices from the App Store, by product id. */
  prices(productIds: string[]): Promise<Record<string, string>>;
  /** Buys one pack for this user (appAccountToken = user id, checked by the server). */
  buy(productId: string, userId: string, verify: VerifyPurchase): Promise<PurchaseOutcome>;
  /**
   * Hands unfinished transactions (app closed mid-purchase, approved Ask to Buy…)
   * to the server and finishes them. Returns the credits added.
   */
  restore(verify: VerifyPurchase): Promise<number>;
}
