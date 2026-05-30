-- CHECKOUT CREATORS (Creator Economy OS) DATABASE SCHEMA - V3 REVENUE & MONETIZATION
-- Extensions and Enums
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE creator_category AS ENUM (
        'INFLUENCER', 'CONTENT_CREATOR', 'UGC_CREATOR', 'PHOTOGRAPHER', 
        'VIDEOGRAPHER', 'EDITOR', 'MODEL', 'AGENCY', 'OTHER'
    );
    CREATE TYPE opportunity_status AS ENUM ('DRAFT', 'PUBLISHED', 'MATCHED', 'NEGOTIATION', 'ACTIVE', 'COMPLETED', 'CANCELLED');
    CREATE TYPE application_status AS ENUM ('APPLIED', 'INVITED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED');
    CREATE TYPE contract_status AS ENUM ('DRAFT', 'PENDING', 'SIGNED', 'COMPLETED', 'DISPUTED');
    CREATE TYPE payment_status AS ENUM ('PENDING', 'ESCROWED', 'RELEASED', 'REFUNDED');
    CREATE TYPE file_category AS ENUM ('REFERENCE', 'DELIVERABLE', 'CONTRACT', 'ASSET');
    CREATE TYPE activity_type AS ENUM ('WORKSPACE_CREATED', 'CONTRACT_SIGNED', 'MILESTONE_SUBMITTED', 'MILESTONE_APPROVED', 'FILE_UPLOADED', 'PAYMENT_RELEASED');
    
    -- V2.5 Additions
    CREATE TYPE creator_level AS ENUM ('RISING', 'PROFESSIONAL', 'ELITE', 'VERIFIED_PRO');
    CREATE TYPE business_level AS ENUM ('NEW', 'ACTIVE', 'TRUSTED', 'VERIFIED', 'PREMIUM');
    CREATE TYPE availability_status AS ENUM ('AVAILABLE_NOW', 'THIS_WEEK', 'THIS_MONTH', 'BUSY');
    CREATE TYPE verification_type AS ENUM ('IDENTITY', 'PORTFOLIO', 'BUSINESS', 'AGENCY');
    
    -- V3 Additions (Revenue & Subscriptions)
    CREATE TYPE subscription_tier AS ENUM ('FREE', 'CREATOR_PRO', 'BUSINESS_PRO', 'AGENCY_PRO', 'ENTERPRISE');
    CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'TRIALING', 'CANCELED', 'PAST_DUE', 'UNPAID');
    CREATE TYPE billing_cycle AS ENUM ('MONTHLY', 'ANNUALLY');
    CREATE TYPE boost_type AS ENUM ('PROFILE', 'OPPORTUNITY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. CREATOR PROFILES
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  category creator_category DEFAULT 'OTHER',
  subcategories TEXT[],
  rates JSONB DEFAULT '{}'::jsonb,
  portfolio_gallery TEXT[], 
  videos TEXT[], 
  case_studies JSONB DEFAULT '[]'::jsonb,
  experience TEXT,
  languages TEXT[],
  skills TEXT[],
  availability availability_status DEFAULT 'THIS_WEEK',
  is_verified BOOLEAN DEFAULT false,
  verification_level verification_type DEFAULT 'IDENTITY',
  creator_level creator_level DEFAULT 'RISING',
  completion_rate INTEGER DEFAULT 0,
  repeat_client_rate INTEGER DEFAULT 0,
  trust_score INTEGER DEFAULT 50,
  followers JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  website TEXT,
  seo_metadata JSONB DEFAULT '{}'::jsonb,
  -- V3 Entitlements
  subscription_tier subscription_tier DEFAULT 'FREE',
  is_featured BOOLEAN DEFAULT false,
  boost_active_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.1 BUSINESS PROFILES
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  industry TEXT,
  business_level business_level DEFAULT 'NEW',
  trust_score INTEGER DEFAULT 50,
  payment_reliability_score INTEGER DEFAULT 100,
  projects_posted INTEGER DEFAULT 0,
  creators_hired INTEGER DEFAULT 0,
  seo_metadata JSONB DEFAULT '{}'::jsonb,
  is_verified BOOLEAN DEFAULT false,
  verification_level verification_type DEFAULT 'BUSINESS',
  -- V3 Entitlements
  subscription_tier subscription_tier DEFAULT 'FREE',
  organization_id UUID, -- For Enterprise/Agency
  created_at TIMESTAMPTZ DEFAULT now()
);

-- V3: ORGANIZATIONS & TEAMS (Agency / Enterprise)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type subscription_tier DEFAULT 'AGENCY_PRO',
  billing_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- V3: SUBSCRIPTION PLANS & ENTITLEMENTS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier subscription_tier NOT NULL,
  name TEXT NOT NULL,
  price_monthly NUMERIC DEFAULT 0,
  price_annually NUMERIC DEFAULT 0,
  features JSONB DEFAULT '{}'::jsonb, -- e.g., {"max_opportunities": -1, "ai_insights": true}
  is_active BOOLEAN DEFAULT true,
  stripe_product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status subscription_status DEFAULT 'ACTIVE',
  cycle billing_cycle DEFAULT 'MONTHLY',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- V3: USAGE TRACKING (For Entitlement Limits)
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- e.g., 'opportunities_posted', 'searches_performed'
  current_value INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ DEFAULT now(),
  period_end TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, metric_name, period_start)
);

-- V3: BOOSTS & FEATURED LISTINGS
CREATE TABLE IF NOT EXISTS public.active_boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL, -- Profile ID or Opportunity ID
  type boost_type NOT NULL,
  start_time TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ NOT NULL,
  multiplier NUMERIC DEFAULT 1.5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- V3: PROMOS & COUPONS
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER,
  discount_amount NUMERIC,
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- V3: REFERRAL ENGINE
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING', -- PENDING, CONVERTED
  reward_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referred_id)
);

-- 2. OPPORTUNITIES
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category creator_category,
  budget_range JSONB,
  location TEXT,
  timeline TEXT,
  skills_required TEXT[],
  deliverables TEXT[],
  urgency TEXT,
  status opportunity_status DEFAULT 'DRAFT',
  visibility TEXT DEFAULT 'PUBLIC',
  match_score INTEGER DEFAULT 0,
  seo_metadata JSONB DEFAULT '{}'::jsonb,
  -- V3 Promoted Visiblity
  is_featured BOOLEAN DEFAULT false,
  boost_active_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. OPPORTUNITY APPLICATIONS & SHORTLISTS
CREATE TABLE IF NOT EXISTS public.opportunity_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  status application_status DEFAULT 'APPLIED',
  cover_letter TEXT,
  proposed_rate JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(opportunity_id, creator_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL, 
  target_type TEXT NOT NULL, 
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, target_id, target_type)
);

-- 4. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CONTRACTS
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  terms TEXT NOT NULL,
  deliverables JSONB DEFAULT '[]'::jsonb,
  budget JSONB NOT NULL,
  timeline TEXT,
  status contract_status DEFAULT 'DRAFT',
  signed_by_business BOOLEAN DEFAULT false,
  signed_by_creator BOOLEAN DEFAULT false,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. MILESTONES
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC,
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status payment_status DEFAULT 'PENDING',
  platform_fee NUMERIC DEFAULT 0,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. WORKSPACE FILES
CREATE TABLE IF NOT EXISTS public.workspace_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  category file_category DEFAULT 'REFERENCE',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ACTIVITY TIMELINE
CREATE TABLE IF NOT EXISTS public.workspace_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. SUCCESS STORIES 
CREATE TABLE IF NOT EXISTS public.success_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  seo_metadata JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES (V3 Entitlements included)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read subscription_plans" ON subscription_plans FOR SELECT USING (true);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own subscriptions" ON user_subscriptions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own usage" ON usage_tracking FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE active_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active_boosts" ON active_boosts FOR SELECT USING (true);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own referrals" ON referrals FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Rest of RLS inherited from previous versions...
