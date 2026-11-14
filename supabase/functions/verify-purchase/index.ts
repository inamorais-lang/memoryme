// POST { signedTransaction } → 200 { creditsAdded, balance }.
// The app sends the StoreKit 2 transaction (a JWS signed by Apple). We verify the
// signature chain up to Apple Root CA - G3, check it is a consumable of this app
// bought by this user (appAccountToken), then add the pack's credits exactly once.
import { decodeTransaction } from 'npm:app-store-server-api@1.0.0';
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json } from '../_shared/config.ts';
import { checkTransaction, type AppleTransaction } from '../_shared/purchases.ts';

const BUNDLE_ID = Deno.env.get('APPLE_BUNDLE_ID') ?? 'app.petbubble';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);
    const body = await req.json().catch(() => null);
    if (typeof body?.signedTransaction !== 'string') return json({ code: 'bad_request' }, 400);

    let purchase;
    try {
      const tx = (await decodeTransaction(body.signedTransaction)) as AppleTransaction;
      purchase = checkTransaction(tx, userId, BUNDLE_ID);
    } catch (e) {
      const code = e instanceof Error && /^[a-z_]+$/.test(e.message) ? e.message : 'invalid_signature';
      console.warn('verify-purchase refused', code);
      // Diagnostics only: the reason, never the transaction or the user.
      await ctx.supabaseAdmin
        .rpc('log_purchase_failure', { p_code: code, p_detail: e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300) })
        .then(() => {}, () => {});
      return json({ code }, 400);
    }

    const { data, error } = await ctx.supabaseAdmin.rpc('grant_purchase', {
      p_user_id: userId,
      p_transaction_id: purchase.transactionId,
      p_original_transaction_id: purchase.originalTransactionId,
      p_product_id: purchase.productId,
      p_environment: purchase.environment,
      p_purchased_at: purchase.purchasedAt,
    });
    if (error) {
      console.error('grant_purchase', error);
      await ctx.supabaseAdmin.rpc('log_purchase_failure', { p_code: 'grant_failed', p_detail: error.message.slice(0, 300) }).then(() => {}, () => {});
      return json({ code: error.message.includes('unknown_product') ? 'unknown_product' : 'server_error' }, error.message.includes('unknown_product') ? 400 : 500);
    }
    const row = Array.isArray(data) ? data[0] : data;
    return json({ creditsAdded: row?.credits_added ?? 0, balance: row?.balance ?? null });
  }),
};
