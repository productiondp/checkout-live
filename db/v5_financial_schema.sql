-- CHECKOUT CREATORS (Creator Economy OS) DATABASE SCHEMA - V5 FINANCIAL INFRASTRUCTURE
-- Extensions and Enums
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    -- Previous Enums Omitted for Brevity
    
    -- V5 Financial Enums
    CREATE TYPE financial_provider AS ENUM ('STRIPE', 'RAZORPAY', 'CASHFREE', 'INTERNAL');
    CREATE TYPE transaction_type AS ENUM ('ESCROW_DEPOSIT', 'PAYOUT', 'REFUND', 'COMMISSION', 'SUBSCRIPTION_PAYMENT');
    CREATE TYPE transaction_status AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'DISPUTED');
    CREATE TYPE escrow_status AS ENUM ('FUNDED', 'PARTIALLY_RELEASED', 'RELEASED', 'REFUNDED', 'DISPUTED');
    CREATE TYPE payout_status AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
    CREATE TYPE dispute_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_FAVOR_CREATOR', 'RESOLVED_FAVOR_BUSINESS', 'REFUNDED');
    CREATE TYPE refund_status AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- [PREVIOUS TABLES OMITTED FOR BREVITY]

-- 1. CONNECTED ACCOUNTS (Creator Bank/Stripe routing)
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider financial_provider NOT NULL,
  provider_account_id TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- 2. TRANSACTIONS (Immutable Ledger)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT UNIQUE NOT NULL,
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'PENDING',
  provider financial_provider NOT NULL,
  provider_transaction_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payer_id UUID REFERENCES public.profiles(id),
  payee_id UUID REFERENCES public.profiles(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  milestone_id UUID REFERENCES public.milestones(id),
  metadata JSONB DEFAULT '{}'::jsonb, -- Store tax, GST, VAT placeholders here
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ESCROWS (Holds funds until milestone approval)
CREATE TABLE IF NOT EXISTS public.escrows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE RESTRICT,
  deposit_transaction_id UUID REFERENCES public.transactions(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status escrow_status DEFAULT 'FUNDED',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(milestone_id)
);

-- 4. COMMISSIONS (Dynamic Platform Fees)
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE RESTRICT,
  workspace_id UUID REFERENCES public.workspaces(id),
  rate_percentage NUMERIC NOT NULL, -- Evaluated from V3 Subscription Tier
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PAYOUTS (Creator Bank Transfers)
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  connected_account_id UUID REFERENCES public.connected_accounts(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status payout_status DEFAULT 'PENDING',
  provider_payout_id TEXT,
  expected_arrival_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. DISPUTES
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id),
  raised_by UUID REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  status dispute_status DEFAULT 'OPEN',
  evidence_urls TEXT[],
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. REFUNDS
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL,
  reason TEXT,
  status refund_status DEFAULT 'PENDING',
  provider_refund_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. FINANCIAL AUDIT LOGS (Strict immutability)
CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'TRANSACTION', 'ESCROW', 'PAYOUT'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID, -- System or Admin or User
  previous_state JSONB,
  new_state JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own transactions" ON transactions FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);
-- Insert/Update restricted to service_role (Admin/System only)

ALTER TABLE escrows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View workspace escrows" ON escrows FOR SELECT USING (
  EXISTS (SELECT 1 FROM workspaces WHERE id = escrows.workspace_id AND (business_id = auth.uid() OR creator_id = auth.uid()))
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own payouts" ON payouts FOR SELECT USING (auth.uid() = creator_id);

ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own connected accounts" ON connected_accounts FOR ALL USING (auth.uid() = user_id);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View workspace disputes" ON disputes FOR SELECT USING (
  EXISTS (SELECT 1 FROM workspaces WHERE id = disputes.workspace_id AND (business_id = auth.uid() OR creator_id = auth.uid()))
);
CREATE POLICY "Insert own disputes" ON disputes FOR INSERT WITH CHECK (auth.uid() = raised_by);

ALTER TABLE financial_audit_logs ENABLE ROW LEVEL SECURITY;
-- Audit logs strictly Admin only (service_role bypasses RLS)
