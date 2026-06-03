-- 1. Ensure everyone can view the opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Opportunities are viewable by everyone" ON public.opportunities;
CREATE POLICY "Opportunities are viewable by everyone" 
ON public.opportunities FOR SELECT 
USING (true);

-- 2. Generate 10 dummy projects/opportunities
INSERT INTO public.opportunities (
  business_id, 
  title, 
  description, 
  category, 
  budget, 
  location, 
  status
)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Strategic Creator Campaign 0' || g.num,
  'We are looking for talented creators for an upcoming high-impact campaign. Requirements: Strong local audience engagement, premium content quality, and professional communication.',
  'INFLUENCER',
  '₹20,000 - ₹50,000',
  'Trivandrum',
  'ACTIVE'
FROM generate_series(1, 10) AS g(num);

-- 3. Insert into posts to show up on the Marketplace feed
INSERT INTO public.posts (
  author_id,
  type,
  title,
  content,
  industry,
  location,
  budget,
  tier,
  metadata,
  created_at
)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'HIRING'::post_type,
  'Strategic Creator Campaign 0' || g.num,
  'We are looking for talented creators for an upcoming high-impact campaign. Requirements: Strong local audience engagement, premium content quality, and professional communication.',
  'Creative',
  'Trivandrum',
  '₹20,000 - ₹50,000',
  1,
  '{"focus_area": "Content Creation", "experience_level": "Professional"}'::jsonb,
  now()
FROM generate_series(1, 10) AS g(num);
