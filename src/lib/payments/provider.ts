import { StripeProvider } from './stripe';

export interface PaymentIntentOptions {
  amount: number;
  currency: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}

export interface PayoutOptions {
  connectedAccountId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
}

export interface PaymentProvider {
  createEscrowDeposit(options: PaymentIntentOptions): Promise<{ id: string; clientSecret: string }>;
  createPayout(options: PayoutOptions): Promise<{ id: string; status: string }>;
  processRefund(transactionId: string, amount?: number): Promise<{ id: string; status: string }>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}

/**
 * Factory pattern to resolve the configured payment provider.
 */
export function getPaymentProvider(provider: 'STRIPE' | 'RAZORPAY' | 'CASHFREE'): PaymentProvider {
  switch (provider) {
    case 'STRIPE':
      return new StripeProvider(); 
    case 'RAZORPAY':
      throw new Error("Razorpay provider not fully implemented yet.");
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}
