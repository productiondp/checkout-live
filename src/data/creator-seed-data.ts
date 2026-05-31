export interface SocialMetrics {
  followers: Record<string, number>;
  engagement_rate: number;
  growth_rate: number;
  audience_geography: Record<string, number>;
  audience_interests: string[];
  audience_demographics: Record<string, number>;
}

export interface ModelMeasurements {
  height?: string;
  weight?: string;
  bust?: string;
  waist?: string;
  hips?: string;
  shoe_size?: string;
  hair_color?: string;
  eye_color?: string;
  skin_tone?: string;
  dress_size?: string;
}

export interface Review {
  id: string;
  from_name: string;
  role: string;
  company: string;
  score: number;
  comment: string;
  created_at: string;
}

export interface PastCampaign {
  id: string;
  brand: string;
  role: string;
  result: string;
  media_url?: string;
}

export interface SeedCreator {
  id: string;
  full_name: string;
  category: "INFLUENCER" | "CONTENT_CREATOR" | "UGC_CREATOR" | "PHOTOGRAPHER" | "VIDEOGRAPHER" | "MODEL" | "AGENCY" | "OTHER";
  subcategories: string[];
  bio: string;
  experience: string;
  location: string;
  city: string;
  languages: string[];
  skills: string[];
  avatar_url: string;
  portfolio_images: string[];
  video_links: string[];
  social_links: Record<string, string>;
  social_metrics: SocialMetrics;
  measurements?: ModelMeasurements;
  availability: "AVAILABLE_NOW" | "THIS_WEEK" | "THIS_MONTH" | "BUSY";
  is_verified: boolean;
  creator_level: "RISING" | "PROFESSIONAL" | "ELITE" | "VERIFIED_PRO";
  trust_score: number;
  completion_rate: number;
  repeat_client_rate: number;
  rates: Record<string, any>;
  rate_card: string;
  website?: string;
  reviews: Review[];
  past_campaigns: PastCampaign[];
  is_featured: boolean;
}


export interface BusinessAttributes {
  industry: string;
  location: string;
  budget_level: "low" | "medium" | "high";
  needed_category: string;
}

/**
 * GENERATES A DYNAMIC 0-100 MATCH SCORE
 * Simulates a production matching engine based on standard weighted heuristics.
 */
export function calculateMatchScore(creator: SeedCreator, business: BusinessAttributes): number {
  let score = 0;

  // 1. Industry & Specialty Match (20% Weight)
  const isIndustryMatch = creator.subcategories.some(sub => 
    sub.toLowerCase().includes(business.industry.toLowerCase()) || 
    business.industry.toLowerCase().includes(sub.toLowerCase())
  );
  const indScore = isIndustryMatch ? 100 : creator.category === "OTHER" ? 50 : 75;
  score += indScore * 0.20;

  // 2. Location Match (20% Weight)
  const isCityMatch = creator.city.toLowerCase() === business.location.toLowerCase();
  const locScore = isCityMatch ? 100 : creator.location.toLowerCase().includes(business.location.toLowerCase()) ? 80 : 40;
  score += locScore * 0.20;

  // 3. Category Match (20% Weight)
  const isCatMatch = creator.category === business.needed_category || 
                     (business.needed_category === "MODEL" && creator.category === "MODEL") || 
                     (business.needed_category === "INFLUENCER" && creator.category === "INFLUENCER");
  const catScore = isCatMatch ? 100 : 60;
  score += catScore * 0.20;

  // 4. Budget/Rate Match (15% Weight)
  let budgetScore = 80;
  const rateValue = creator.rates.hourly || creator.rates.daily / 8 || 1500;
  if (business.budget_level === "high") {
    budgetScore = 100;
  } else if (business.budget_level === "medium") {
    budgetScore = rateValue <= 2500 ? 100 : 70;
  } else {
    budgetScore = rateValue <= 1500 ? 100 : rateValue <= 2500 ? 60 : 30;
  }
  score += budgetScore * 0.15;

  // 5. Availability Match (15% Weight)
  let availScore = 50;
  if (creator.availability === "AVAILABLE_NOW") availScore = 100;
  else if (creator.availability === "THIS_WEEK") availScore = 90;
  else if (creator.availability === "THIS_MONTH") availScore = 70;
  score += availScore * 0.15;

  // 6. Reputation & Verification Match (10% Weight)
  let repScore = creator.trust_score * 0.7 + (creator.is_verified ? 30 : 0);
  score += repScore * 0.10;

  return Math.round(Math.max(20, Math.min(100, score)));
}

/**
 * GENERATES A DYNAMIC 0-100 PROFILE STRENGTH SCORE
 * Calculates profile completeness, social indicators, portfolio quality and verification status.
 */
export function calculateProfileStrength(creator: SeedCreator): number {
  let score = 0;

  // 1. Completion rate (30% weight)
  score += (creator.completion_rate || 50) * 0.30;

  // 2. Portfolio Gallery items (20% weight)
  const photoCount = creator.portfolio_images?.length || 0;
  const photoScore = photoCount >= 4 ? 100 : photoCount * 25;
  score += photoScore * 0.20;

  // 3. Social Metrics accounts loaded (20% weight)
  const socialCount = Object.keys(creator.social_links || {}).length;
  const socialScore = socialCount >= 3 ? 100 : socialCount * 33;
  score += socialScore * 0.20;

  // 4. Verification and Trust Level (20% weight)
  const trustScore = creator.trust_score || 50;
  const verScore = creator.is_verified ? 100 : 70;
  score += (trustScore * 0.5 + verScore * 0.5) * 0.20;

  // 5. Active campaigns and Reviews (10% weight)
  const campCount = creator.past_campaigns?.length || 0;
  const revCount = creator.reviews?.length || 0;
  const activityScore = Math.min(100, (campCount + revCount) * 20 + 40);
  score += activityScore * 0.10;

  return Math.round(Math.max(10, Math.min(100, score)));
}

export function getMatchLabel(score: number): "Perfect Match" | "Strong Match" | "Moderate Match" | "Weak Match" {
  if (score >= 90) return "Perfect Match";
  if (score >= 75) return "Strong Match";
  if (score >= 50) return "Moderate Match";
  return "Weak Match";
}

export function getProfileStrengthLabel(score: number): "Elite Profile" | "Strong Profile" | "Growing Profile" | "New Profile" {
  if (score >= 90) return "Elite Profile";
  if (score >= 75) return "Strong Profile";
  if (score >= 50) return "Growing Profile";
  return "New Profile";
}
