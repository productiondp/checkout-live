import Stripe from 'stripe';
import { PaymentProvider, PaymentIntentOptions, PayoutOptions } from './provider';

// Hard fallback for missing env vars during local dev conversion
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';

const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: '2023-10-16' as any, // Target stable version
  typescript: true,
});

export class StripeProvider implements PaymentProvider {
  
  async createEscrowDeposit(options: PaymentIntentOptions) {
    if (STRIPE_SECRET === 'sk_test_dummy') {
      console.warn("WARNING: Using dummy Stripe Secret. Transaction will fail.");
    }
    
    // Create a PaymentIntent that places funds on hold (capture_method: manual can be used for explicit escrow)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(options.amount * 100), // Convert to cents
      currency: options.currency,
      metadata: options.metadata,
      setup_future_usage: 'off_session', 
      capture_method: 'automatic', // Platform captures immediately, funds held in platform Stripe balance
    }, { idempotencyKey: options.idempotencyKey });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret as string
    };
  }

  async createPayout(options: PayoutOptions) {
    // Transfer funds from the Platform Stripe balance to the Creator's Connected Account
    const transfer = await stripe.transfers.create({
      amount: Math.round(options.amount * 100),
      currency: options.currency,
      destination: options.connectedAccountId,
      metadata: { idempotencyKey: options.idempotencyKey }
    }, { idempotencyKey: options.idempotencyKey });

    return {
      id: transfer.id,
      status: 'PAID' // Strip Transfers are technically synchronous on creation
    };
  }

  async processRefund(transactionId: string, amount?: number) {
    const refund = await stripe.refunds.create({
      payment_intent: transactionId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return {
      id: refund.id,
      status: refund.status || 'PENDING'
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Validates the cryptographic signature matches the payload body
      stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
      return true;
    } catch (err) {
      console.error("[Stripe Webhook Error]: Signature mismatch.", err);
      return false;
    }
  }
}
