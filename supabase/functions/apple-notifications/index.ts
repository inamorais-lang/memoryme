// POST from Apple (App Store Server Notifications V2) → 200.
// No user auth: the body is a JWS signed by Apple, verified up to Apple Root CA - G3.
// On REFUND / REVOKE, the purchase loses its credits (revoke_purchase is idempotent).
import { decodeNotificationPayload, decodeTransaction } from 'npm:app-store-server-api@1.0.0';
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json } from '../_shared/config.ts';
import { REVOKING_NOTIFICATIONS } from '../_shared/purchases.ts';

const BUNDLE_ID = Deno.env.get('APPLE_BUNDLE_ID') ?? 'app.petbubble';

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const body = await req.json().catch(() => null);
    if (typeof body?.signedPayload !== 'string') return json({ code: 'bad_request' }, 400);

    let notification;
    try {
      notification = await decodeNotificationPayload(body.signedPayload);
    } catch {
      return json({ code: 'invalid_signature' }, 400);
    }
    if (notification.data?.bundleId !== BUNDLE_ID) return json({ ignored: 'wrong_app' });
    if (!REVOKING_NOTIFICATIONS.has(notification.notificationType)) return json({ ignored: notification.notificationType });

    const signed = notification.data?.signedTransactionInfo;
    if (!signed) return json({ code: 'bad_request' }, 400);
    let transactionId: string | undefined;
    try {
      transactionId = (await decodeTransaction(signed)).transactionId;
    } catch {
      return json({ code: 'invalid_signature' }, 400);
    }
    const { error } = await ctx.supabaseAdmin.rpc('revoke_purchase', { p_transaction_id: transactionId });
    if (error) {
      console.error('revoke_purchase', error);
      return json({ code: 'server_error' }, 500); // Apple retries
    }
    return json({ revoked: true });
  }),
};
