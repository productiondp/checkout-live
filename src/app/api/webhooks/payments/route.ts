import { NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments/provider';
import { createClient } from '@/utils/supabase/server';

/**
 * STRIPE/RAZORPAY WEBHOOK HANDLER
 * Idempotent, secure endpoint to handle async payment events.
 */

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') || req.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Abstracted Provider (Swap Stripe vs Razorpay easily)
  const provider = getPaymentProvider('STRIPE');

  try {
    // 1. Verify cryptographic signature
    const isValid = provider.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(payload);
    const supabase = createClient();

    // 2. Handle specific events idempotently
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Escrow successfully funded by business
        await handleEscrowFunded(event.data.object, supabase);
        break;

      case 'payout.paid':
        // Creator successfully received money in their bank
        await handlePayoutPaid(event.data.object, supabase);
        break;

      case 'charge.refunded':
        await handleRefunded(event.data.object, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleEscrowFunded(paymentIntent: any, supabase: any) {
  // Update Escrow status in DB, create Audit Log
  const { idempotencyKey } = paymentIntent.metadata;
  
  // Example Transaction Update (Idempotent by key)
  await supabase
    .from('transactions')
    .update({ status: 'SUCCEEDED' })
    .eq('idempotency_key', idempotencyKey);
    
  // Notify users, etc.
}

async function handlePayoutPaid(payout: any, supabase: any) {
  // Update Payout status
}

async function handleRefunded(charge: any, supabase: any) {
  // Update Refund status
}
