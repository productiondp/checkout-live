import { createClient } from '@/utils/supabase/server';
import { getPaymentProvider } from './provider';
import { CommissionEngine } from './commission';

/**
 * FINANCIAL SAFETY ENGINE - PRODUCTION (V8)
 * Handles the secure release of funds from Escrow to the Creator's Connected Account.
 */

export const EscrowEngine = {
  
  /**
   * Releases funds from Escrow for a given milestone.
   * VERY IMPORTANT: In Supabase, standard client calls are not transactional. 
   * This function calls a secure PostgreSQL RPC function that wraps the SELECT FOR UPDATE locking logic
   * to ensure race conditions (double clicks) cannot release funds twice.
   */
  async releaseEscrow(milestoneId: string, businessId: string) {
    const supabase = createClient();
    
    // 1. Invoke Secure PostgreSQL Transaction via RPC
    // The RPC function `secure_escrow_release` internally locks the row:
    // SELECT * FROM escrows WHERE milestone_id = $1 FOR UPDATE;
    // It verifies the escrow status is 'FUNDED' and updates it to 'RELEASED', returning the escrow details.
    
    const { data: escrow, error: rpcError } = await supabase
      .rpc('secure_escrow_release', { p_milestone_id: milestoneId, p_business_id: businessId });
      
    if (rpcError || !escrow) {
      throw new Error(`Escrow release failed: ${rpcError?.message || 'Race condition prevented or not found.'}`);
    }
    
    // 2. We have successfully locked and updated the database escrow to 'RELEASED'.
    // Now we must calculate commissions and physically move the money via Stripe.
    
    try {
      const { workspace_id, amount, currency } = escrow;
      
      // Fetch Workspace context
      const { data: workspace } = await supabase.from('workspaces').select('creator_id').eq('id', workspace_id).single();
      const creatorId = workspace?.creator_id;
      
      // Fetch Creator's Stripe Connected Account
      const { data: connectedAccount } = await supabase.from('connected_accounts').select('provider_account_id').eq('user_id', creatorId).single();
      if (!connectedAccount) throw new Error("Creator does not have a verified connected account.");

      // Calculate Splits
      const splits = await CommissionEngine.calculateSplits(amount, businessId, creatorId);
      
      // Execute Physical Payout (Stripe Transfer)
      const provider = getPaymentProvider('STRIPE');
      const payoutIdempotencyKey = `payout_${milestoneId}_${Date.now()}`;
      
      const payoutResult = await provider.createPayout({
        connectedAccountId: connectedAccount.provider_account_id,
        amount: splits.creatorPayout,
        currency: currency,
        idempotencyKey: payoutIdempotencyKey
      });
      
      // Record Payout in DB
      await supabase.from('payouts').insert({
        creator_id: creatorId,
        connected_account_id: connectedAccount.provider_account_id,
        amount: splits.creatorPayout,
        currency: currency,
        status: payoutResult.status,
        provider_payout_id: payoutResult.id
      });
      
      // Record Commission taken by Platform
      await supabase.from('commissions').insert({
        workspace_id: workspace_id,
        rate_percentage: splits.ratePercentage,
        amount: splits.platformFee,
        currency: currency
      });

      return { success: true, payout_id: payoutResult.id };
      
    } catch (err: any) {
      // If Stripe transfer fails, we have an inconsistency. 
      // In a pure distributed transaction, we'd roll back the DB. 
      // Since Stripe failed, we flag for manual admin intervention.
      console.error("FATAL: Stripe Payout Failed after Escrow Release in DB.", err);
      
      await supabase.from('financial_audit_logs').insert({
        entity_type: 'ESCROW',
        entity_id: escrow.id,
        action: 'PAYOUT_FAILED',
        new_state: { error: err.message },
      });
      
      throw err;
    }
  }
};
