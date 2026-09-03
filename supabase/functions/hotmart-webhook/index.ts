import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = { 'Content-Type': 'application/json' };
const activeEvents = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE']);
const inactiveEvents = new Set([
  'PURCHASE_CANCELED', 'PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK',
  'PURCHASE_EXPIRED', 'PURCHASE_DELAYED',
]);

Deno.serve(async (request) => {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error('hotmart-webhook unhandled error:', error);
    return response(500, { error: 'Internal error', message: String((error as Error)?.message || error) });
  }
});

async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== 'POST') return response(405, { error: 'Method not allowed' });

  const expectedHottok = Deno.env.get('HOTMART_HOTTOK');
  const receivedHottok = request.headers.get('x-hotmart-hottok');
  if (!expectedHottok || receivedHottok !== expectedHottok) {
    return response(401, { error: 'Invalid Hotmart token' });
  }

  const payload = await request.json();
  const eventId = String(payload.id || '');
  const eventName = String(payload.event || '');
  const buyerEmail = String(payload.data?.buyer?.email || payload.data?.subscriber?.email || '').toLowerCase();
  const productId = String(payload.data?.product?.id ?? '');
  const productName = String(payload.data?.product?.name || '');
  const expectedProductId = Deno.env.get('HOTMART_PRODUCT_ID');
  const isHotmartPurchaseTest = productId === '0' && /^(produto|product) test postback2$/i.test(productName);
  const isHotmartCancellationTest = eventName === 'SUBSCRIPTION_CANCELLATION'
    && productId === '788921'
    && productName === 'Product name com ç e á'
    && buyerEmail === 'test@hotmart.com'
    && String(payload.data?.subscriber?.code || '') === '0000aaaa';
  const isHotmartTest = isHotmartPurchaseTest || isHotmartCancellationTest;

  if (!eventId || !eventName) return response(400, { error: 'Incomplete payload' });
  if (isHotmartTest) return response(200, { ok: true, test: true });
  if (!buyerEmail) return response(400, { error: 'Incomplete payload' });
  if (expectedProductId && productId !== expectedProductId) return response(403, { error: 'Unexpected product' });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { error: eventError } = await supabase.from('hotmart_webhook_events').insert({
    event_id: eventId,
    event_name: eventName,
    payload,
  });
  if (eventError?.code === '23505') return response(200, { ok: true, duplicate: true });
  if (eventError) {
    console.error('hotmart-webhook insert event error:', eventError);
    return response(500, { error: 'Could not register event' });
  }

  const { data: profile } = await supabase.from('profiles').select('id').eq('email', buyerEmail).maybeSingle();
  const subscription = payload.data?.subscription;
  const purchase = payload.data?.purchase;
  const providerSubscriptionId = String(subscription?.subscriber?.code || subscription?.id || purchase?.transaction || eventId);
  const accessUntil = eventName === 'SUBSCRIPTION_CANCELLATION' && payload.data?.date_next_charge
    ? new Date(payload.data.date_next_charge).toISOString()
    : null;
  const status = activeEvents.has(eventName)
    ? 'active'
    : inactiveEvents.has(eventName)
      ? (eventName === 'PURCHASE_DELAYED' ? 'past_due' : 'expired')
      : eventName === 'SUBSCRIPTION_CANCELLATION' ? 'canceled' : null;

  if (!status) return response(200, { ok: true, ignored: true });

  const { error: subscriptionError } = await supabase.from('subscriptions').upsert({
    user_id: profile?.id || null,
    buyer_email: buyerEmail,
    provider: 'hotmart',
    provider_subscription_id: providerSubscriptionId,
    provider_transaction_id: purchase?.transaction ? String(purchase.transaction) : null,
    provider_product_id: productId || null,
    status,
    access_until: accessUntil,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'provider,provider_subscription_id' });

  if (subscriptionError) {
    console.error('hotmart-webhook upsert subscription error:', subscriptionError);
    return response(500, { error: 'Could not update subscription' });
  }
  return response(200, { ok: true });
}

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
