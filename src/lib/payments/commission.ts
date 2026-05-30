import { createClient } from '@/utils/supabase/server';

/**
 * COMMISSION ENGINE
 * Dynamically calculates platform fees based on the user's active V3 Subscription Tier.
 */

export const CommissionEngine = {
  
  /**
   * Returns the percentage rate the platform should take.
   */
  async getCommissionRate(businessId: string, creatorId: string): Promise<number> {
    const supabase = createClient();
    
    // 1. Fetch Creator's Subscription Tier
    const { data: creatorSub } = await supabase
      .from('user_subscriptions')
      .select('subscription_plans(tier)')
      .eq('user_id', creatorId)
      .eq('status', 'ACTIVE')
      .single();

    // 2. Fetch Business's Subscription Tier (Businesses might pay for 0% fee plans)
    const { data: businessSub } = await supabase
      .from('user_subscriptions')
      .select('subscription_plans(tier)')
      .eq('user_id', businessId)
      .eq('status', 'ACTIVE')
      .single();

    const creatorTier = creatorSub?.subscription_plans?.tier || 'FREE';
    const businessTier = businessSub?.subscription_plans?.tier || 'FREE';

    // Business Enterprise Tier overriding all fees
    if (businessTier === 'ENTERPRISE') return 0.0;
    
    // Creator Tier logic
    switch (creatorTier) {
      case 'CREATOR_PRO':
        return 10.0; // 10% fee
      case 'AGENCY_PRO':
        return 8.0;  // 8% fee
      case 'FREE':
      default:
        return 15.0; // 15% default fee
    }
  },

  /**
   * Calculates the exact monetary splits for a given transaction amount.
   */
  async calculateSplits(amount: number, businessId: string, creatorId: string) {
    const ratePercentage = await this.getCommissionRate(businessId, creatorId);
    
    const platformFee = parseFloat(((amount * ratePercentage) / 100).toFixed(2));
    const creatorPayout = parseFloat((amount - platformFee).toFixed(2));

    return {
      totalAmount: amount,
      ratePercentage,
      platformFee,
      creatorPayout
    };
  }

};
