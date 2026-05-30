import { createClient } from '@/utils/supabase/server';

export type FeatureKey = 
  | 'MAX_OPPORTUNITIES' 
  | 'MAX_SHORTLISTS' 
  | 'AI_RECOMMENDATIONS' 
  | 'PRIORITY_RANKING' 
  | 'ADVANCED_ANALYTICS' 
  | 'PORTFOLIO_LIMIT';

interface EntitlementCheckResult {
  allowed: boolean;
  limitReached: boolean;
  currentUsage?: number;
  limit?: number;
  requiresUpgradeTo?: string;
}

/**
 * Centralized Entitlement Engine
 * Evaluates user permissions based on their active Subscription Plan and Usage Tracking limits.
 */
export async function checkEntitlement(userId: string, feature: FeatureKey): Promise<EntitlementCheckResult> {
  const supabase = createClient();

  try {
    // 1. Fetch user's active subscription & plan features
    const { data: sub, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        status,
        subscription_plans (
          tier,
          features
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .single();

    // Default to FREE tier features if no active subscription found
    const features = sub?.subscription_plans?.features || {
      'MAX_OPPORTUNITIES': 1,
      'MAX_SHORTLISTS': 5,
      'AI_RECOMMENDATIONS': false,
      'PRIORITY_RANKING': false,
      'ADVANCED_ANALYTICS': false,
      'PORTFOLIO_LIMIT': 3
    };

    const featureValue = features[feature];

    // Boolean features (e.g., AI_RECOMMENDATIONS)
    if (typeof featureValue === 'boolean') {
      if (!featureValue) {
        return { allowed: false, limitReached: false, requiresUpgradeTo: 'CREATOR_PRO' };
      }
      return { allowed: true, limitReached: false };
    }

    // Quantitative limits (e.g., MAX_OPPORTUNITIES)
    if (typeof featureValue === 'number') {
      if (featureValue === -1) {
        return { allowed: true, limitReached: false }; // Unlimited
      }

      // Check usage tracking table for current period consumption
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('current_value')
        .eq('user_id', userId)
        .eq('metric_name', feature)
        .gte('period_end', new Date().toISOString())
        .single();

      const currentUsage = usage?.current_value || 0;
      
      if (currentUsage >= featureValue) {
        return { 
          allowed: false, 
          limitReached: true, 
          currentUsage, 
          limit: featureValue,
          requiresUpgradeTo: 'BUSINESS_PRO' 
        };
      }

      return { allowed: true, limitReached: false, currentUsage, limit: featureValue };
    }

    // Unknown feature
    return { allowed: false, limitReached: false };

  } catch (error) {
    console.error('Entitlement check failed:', error);
    return { allowed: false, limitReached: false };
  }
}
