-- CHECKOUT CREATORS - V6 ENTERPRISE HARDENING & OPTIMIZATION SCHEMA
-- Run this script to apply performance indexes and strict RLS updates to the existing schema.

-- 1. PERFORMANCE OPTIMIZATION: B-Tree Indexes for Foreign Keys & Search Queries
-- Optimizing for 1M+ Users & 10M+ Opportunities

-- Profile & Discovery Indexes
CREATE INDEX IF NOT EXISTS idx_creator_profiles_category ON public.creator_profiles (category);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_level ON public.creator_profiles (creator_level);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_trust ON public.creator_profiles (trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_availability ON public.creator_profiles (availability);

-- Opportunity Search Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_business_id ON public.opportunities (business_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities (status);
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON public.opportunities (category);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON public.opportunities (created_at DESC);

-- Workspace & Financial Indexes (High Frequency Reads)
CREATE INDEX IF NOT EXISTS idx_workspaces_opportunity_id ON public.workspaces (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_business_id ON public.workspaces (business_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_creator_id ON public.workspaces (creator_id);

CREATE INDEX IF NOT EXISTS idx_transactions_payer_id ON public.transactions (payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee_id ON public.transactions (payee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency ON public.transactions (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_escrows_workspace_id ON public.escrows (workspace_id);
CREATE INDEX IF NOT EXISTS idx_escrows_milestone_id ON public.escrows (milestone_id);

-- Subscriptions & AI Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON public.user_subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON public.ai_recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights (user_id);

-- 2. SECURITY HARDENING: Strict RLS Isolation & Verification

-- Ensure transactions cannot be mutated by clients
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View own transactions" ON public.transactions;
CREATE POLICY "View own transactions" ON public.transactions FOR SELECT 
  USING (auth.uid() = payer_id OR auth.uid() = payee_id);
-- Important: NO insert, update, or delete policies. Mutations must happen via secure Edge Functions/Webhooks using the service_role key.

-- Ensure escrows cannot be mutated by clients
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View workspace escrows" ON public.escrows;
CREATE POLICY "View workspace escrows" ON public.escrows FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM workspaces w 
    WHERE w.id = escrows.workspace_id AND (w.business_id = auth.uid() OR w.creator_id = auth.uid())
  ));

-- Contracts must be strictly isolated to workspace participants
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View workspace contracts" ON public.contracts;
CREATE POLICY "View workspace contracts" ON public.contracts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspaces w 
    WHERE w.id = contracts.workspace_id AND (w.business_id = auth.uid() OR w.creator_id = auth.uid())
  ));
  
-- 3. AUDIT TRIGGERS: Financial Immutability
-- This trigger automatically logs any UPDATE to the transactions table to prevent tampering.
CREATE OR REPLACE FUNCTION audit_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.amount IS DISTINCT FROM NEW.amount THEN
        INSERT INTO public.financial_audit_logs (entity_type, entity_id, action, previous_state, new_state)
        VALUES ('TRANSACTION', NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS transaction_audit_trigger ON public.transactions;
CREATE TRIGGER transaction_audit_trigger
AFTER UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION audit_transaction_changes();

-- 4. CASCADE RULES & CONSTRAINTS
-- Ensure referential integrity is solid (e.g. if an opportunity is deleted, all applications are deleted)
-- Note: Most of these were handled in previous phases with ON DELETE CASCADE, but validating idempotency here.
ALTER TABLE public.transactions ADD CONSTRAINT unique_idempotency UNIQUE (idempotency_key);
