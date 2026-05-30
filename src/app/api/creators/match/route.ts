import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    
    // Ensure the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      opportunityId, 
      skillsRequired = [], 
      location = '', 
      budget = 0,
      industry = ''
    } = body;

    // In a full production system, we would:
    // 1. Fetch the Opportunity embedding using pgvector
    // 2. Query `creator_profiles` using vector similarity
    // 3. Apply weights:
    //    - Skill Match (Semantic similarity)
    //    - Location Match (PostGIS ST_Distance)
    //    - Trust Score Match (Numeric)
    
    // For V1 AI Foundation, we calculate a simulated weighted score via RPC or local logic
    
    const { data: creators, error } = await supabase
      .from('creator_profiles')
      .select(`
        id,
        category,
        skills,
        location,
        trust_score,
        rates,
        is_verified,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .limit(20);

    if (error) {
      throw error;
    }

    // AI WEIGHTED SCORING ENGINE (V1 Logic)
    const scoredCreators = creators.map((creator: any) => {
      let score = 0;
      let breakdown = {
        skill: 0,
        location: 0,
        budget: 0,
        reputation: 0
      };

      // 1. Skill Match (40% weight)
      // Simulate semantic match by array intersection
      const commonSkills = creator.skills?.filter((s: string) => skillsRequired.includes(s)) || [];
      const skillScore = skillsRequired.length > 0 ? (commonSkills.length / skillsRequired.length) * 100 : 80;
      breakdown.skill = skillScore;
      score += skillScore * 0.40;

      // 2. Location Match (30% weight)
      const locScore = (creator.location === location) ? 100 : 50;
      breakdown.location = locScore;
      score += locScore * 0.30;

      // 3. Reputation / Trust (20% weight)
      const trustScore = creator.trust_score || 50;
      breakdown.reputation = trustScore;
      score += trustScore * 0.20;

      // 4. Budget Match (10% weight)
      // (Mock logic for rate vs budget)
      const budgetScore = 90;
      breakdown.budget = budgetScore;
      score += budgetScore * 0.10;

      return {
        ...creator,
        aiMatchScore: Math.round(score),
        aiMatchBreakdown: breakdown
      };
    });

    // Sort by final Match Score descending
    const rankedMatches = scoredCreators.sort((a, b) => b.aiMatchScore - a.aiMatchScore);

    return NextResponse.json({ 
      success: true,
      matches: rankedMatches 
    });

  } catch (error: any) {
    console.error('AI Match Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
