// Checks a StoreKit 2 transaction (already signature-verified) before granting credits.
// Pure logic, so it can be tested without Apple.

export type AppleTransaction = {
  transactionId?: string;
  originalTransactionId?: string;
  bundleId?: string;
  productId?: string;
  type?: string;
  appAccountToken?: string;
  purchaseDate?: number;
  revocationDate?: number;
  environment?: string;
};

export type CheckedPurchase = {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  environment: string;
  purchasedAt: string;
};

/** Throws a short code when the transaction cannot give credits to this user. */
export function checkTransaction(tx: AppleTransaction, userId: string, bundleId: string): CheckedPurchase {
  if (tx.bundleId !== bundleId) throw new Error('wrong_app');
  if (tx.type !== 'Consumable') throw new Error('not_consumable');
  if (!tx.transactionId || !tx.productId || !tx.purchaseDate || !tx.environment) throw new Error('incomplete_transaction');
  if (tx.revocationDate) throw new Error('revoked');
  // The app sets appAccountToken to the user's id when buying: the purchase belongs to this account only.
  if (!tx.appAccountToken || tx.appAccountToken.toLowerCase() !== userId.toLowerCase()) throw new Error('wrong_account');
  return {
    transactionId: tx.transactionId,
    originalTransactionId: tx.originalTransactionId ?? tx.transactionId,
    productId: tx.productId,
    environment: tx.environment,
    purchasedAt: new Date(tx.purchaseDate).toISOString(),
  };
}

/** Notification types after which a purchase must lose its credits. */
export const REVOKING_NOTIFICATIONS = new Set(['REFUND', 'REVOKE']);
