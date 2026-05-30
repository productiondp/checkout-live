/**
 * INDUSTRY & FOCUS AREA SYSTEM (V2.0 - KERALA OPTIMIZED)
 * Comprehensive taxonomy for localized professional matching.
 */

export interface IndustryFocus {
  id: string;
  label: string;
  focusAreas: string[];
  specializations?: Record<string, string[]>;
}

export const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export const INDUSTRY_DATA: IndustryFocus[] = [
  {
    id: "tech_software",
    label: "Technology & Software",
    focusAreas: ["Web Development", "Mobile App Development", "AI / Machine Learning", "Data Analytics", "Cloud / DevOps", "Cybersecurity", "SaaS Development"]
  },
  {
    id: "design_creative",
    label: "Design & Creative",
    focusAreas: ["UI/UX Design", "Graphic Design", "Branding", "Motion Graphics", "Video Editing", "Photography"]
  },
  {
    id: "marketing_media",
    label: "Marketing & Media",
    focusAreas: ["Digital Marketing", "Social Media", "SEO", "Content Creation", "Performance Ads", "Influencer Marketing"]
  },
  {
    id: "business_startups",
    label: "Business & Startups",
    focusAreas: ["Startup Building", "Product Management", "Strategy", "Operations", "Fundraising"]
  },
  {
    id: "sales_success",
    label: "Sales & Customer Success",
    focusAreas: ["B2B Sales", "B2C Sales", "Lead Generation", "CRM", "Customer Support"]
  },
  {
    id: "finance_legal",
    label: "Finance & Legal",
    focusAreas: ["Accounting", "Taxation (GST/India)", "Financial Planning", "Legal Consulting", "Compliance"]
  },
  {
    id: "education_training",
    label: "Education & Training",
    focusAreas: ["Tutoring", "Coaching", "Skill Development", "EdTech", "Workshops"]
  },
  {
    id: "health_wellness",
    label: "Health & Wellness",
    focusAreas: ["Fitness Training", "Nutrition", "Mental Health", "Ayurveda", "Yoga"]
  },
  {
    id: "media_entertainment",
    label: "Media & Entertainment",
    focusAreas: ["Film Production", "YouTube Content", "Podcasting", "Acting", "Script Writing"]
  },
  {
    id: "creator_economy",
    label: "Creator Economy",
    focusAreas: ["Brand Deals", "Sponsorships", "Content Creation", "Audience Growth", "Monetization", "Merch", "Collabs", "Modeling"]
  },
  {
    id: "tourism_hospitality",
    label: "Tourism & Hospitality",
    focusAreas: ["Tour Planning", "Travel Guide", "Homestay Management", "Hotel Operations", "Event Hosting"]
  },
  {
    id: "retail_ecommerce",
    label: "Retail & E-commerce",
    focusAreas: ["Online Selling", "Shopify / Store Setup", "Product Sourcing", "Logistics", "Dropshipping"]
  },
  {
    id: "realestate_construction",
    label: "Real Estate & Construction",
    focusAreas: ["Architecture", "Interior Design", "Construction", "Property Sales", "Site Management"]
  },
  {
    id: "agriculture_farming",
    label: "Agriculture & Farming",
    focusAreas: ["Organic Farming", "Spice Cultivation", "Rubber Plantation", "Coconut Farming", "Agri Business"]
  },
  {
    id: "fisheries_marine",
    label: "Fisheries & Marine",
    focusAreas: ["Fish Farming", "Seafood Export", "Aquaculture", "Marine Logistics"]
  },
  {
    id: "manufacturing_production",
    label: "Manufacturing & Production",
    focusAreas: ["Small Scale Manufacturing", "Industrial Production", "Quality Control", "Packaging"]
  },
  {
    id: "logistics_transportation",
    label: "Logistics & Transportation",
    focusAreas: ["Delivery Services", "Supply Chain", "Fleet Management", "Warehouse Ops"]
  },
  {
    id: "government_public",
    label: "Government & Public Services",
    focusAreas: ["Civil Services", "Public Admin", "Policy Support"]
  },
  {
    id: "ngos_social",
    label: "NGOs & Social Impact",
    focusAreas: ["Community Work", "Sustainability", "Rural Development", "Social Projects"]
  },
  {
    id: "freelance_remote",
    label: "Freelance & Remote Work",
    focusAreas: ["Freelancing", "Consulting", "Virtual Assistance", "Remote Jobs"]
  },
  {
    id: "skilled_trades",
    label: "Skilled Trades & Services",
    focusAreas: ["Electrician", "Plumbing", "Carpentry", "Mechanics", "Technicians"]
  }
];

export const getIndustryById = (id: string) => INDUSTRY_DATA.find(i => i.id === id);

export const getAllFocusAreas = () => INDUSTRY_DATA.flatMap(i => i.focusAreas);

/**
 * INTENT ENGINE (V1.0)
 * Detects the core objective of a post to provide targeted tools.
 */
export type IntentType = 'HIRING' | 'GROWTH' | 'FUNDING' | 'MENTORSHIP' | 'PARTNERSHIP' | 'COLLABORATION' | 'GENERAL';

export interface IntentConfig {
  id: IntentType;
  label: string;
  keywords: string[];
  suggestions: string[];
  color: string;
}

export const INTENT_DATA: IntentConfig[] = [
  {
    id: 'HIRING',
    label: 'Hiring & Talent',
    keywords: ['need', 'hiring', 'dev', 'designer', 'looking for', 'hire', 'vacancy', 'job', 'recruit', 'salary', 'experience'],
    suggestions: ['Role Responsibility', 'Experience Required', 'Budget / Salary', 'Tech Stack'],
    color: 'text-blue-500'
  },
  {
    id: 'GROWTH',
    label: 'Marketing & Growth',
    keywords: ['users', 'marketing', 'ads', 'scale', 'acquisition', 'traffic', 'seo', 'content', 'social media', 'customers'],
    suggestions: ['Target Audience', 'Growth Objective', 'Current Metrics', 'Channels'],
    color: 'text-emerald-500'
  },
  {
    id: 'FUNDING',
    label: 'Funding & Investment',
    keywords: ['funding', 'investor', 'seed', 'equity', 'vc', 'pitch', 'capital', 'fundraising', 'pre-seed', 'series a'],
    suggestions: ['Equity Offered', 'Fund Usage', 'Traction So Far', 'Pitch Deck Link'],
    color: 'text-amber-500'
  },
  {
    id: 'MENTORSHIP',
    label: 'Mentorship & Advice',
    keywords: ['advice', 'mentor', 'guide', 'learn', 'how to', 'coaching', 'expertise', 'roadmap', 'clarity'],
    suggestions: ['Specific Problem', 'Frequency', 'Ideal Mentor Profile', 'Expectation'],
    color: 'text-purple-500'
  },
  {
    id: 'PARTNERSHIP',
    label: 'Partnership & Vision',
    keywords: ['co-founder', 'partner', 'vision', 'collaboration', 'joint venture', 'strategic', 'synergy'],
    suggestions: ['Equity Split', 'Commitment Level', 'Shared Vision', 'Complementary Skills'],
    color: 'text-rose-500'
  },
  {
    id: 'COLLABORATION',
    label: 'Brand Deals & Collabs',
    keywords: ['collab', 'sponsor', 'sponsorship', 'brand deal', 'influencer', 'promote', 'shoutout', 'shoot', 'modeling', 'ugc'],
    suggestions: ['Deliverables', 'Timeline', 'Budget / Barter', 'Target Demographics'],
    color: 'text-fuchsia-500'
  }
];

export const detectIntent = (text: string): IntentType => {
  if (text.length < 3) return 'GENERAL';
  const lower = text.toLowerCase();
  
  // OPTIMIZED: Weighted intent scanning with early exit
  let bestIntent: IntentType = 'GENERAL';
  let maxScore = 0;

  for (const intent of INTENT_DATA) {
    let score = 0;
    for (const key of intent.keywords) {
      if (lower.includes(key)) score += 2; // Exact match weight
      else if (key.length > 5 && lower.includes(key.substring(0, 5))) score += 1; // Partial match weight
    }
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent.id;
    }
    if (maxScore > 10) break; // High confidence threshold reached
  }

  return maxScore >= 2 ? bestIntent : 'GENERAL';
};

export const getIntentConfig = (id: IntentType) => INTENT_DATA.find(i => i.id === id);

/**
 * AUTO-DETECTION (V2.1 - WEIGHTED MATCHING)
 * Suggest industry/focus based on weighted keyword confidence.
 */
export const detectTaxonomy = (text: string) => {
  if (text.length < 5) return null;
  const lower = text.toLowerCase();
  let bestMatch = { industry: "", focus: "", confidence: 0 };

  // 1. High-Precision Direct Rules (Confidence: 100)
  const directRules = [
    { keys: ["wedding", "photography", "photographer", "camera", "drone"], ind: "media_entertainment", foc: "Photography" },
    { keys: ["influencer", "brand deal", "collab", "sponsorship", "ugc", "modeling", "model"], ind: "creator_economy", foc: "Brand Deals" },
    { keys: ["ayurveda", "doctor", "medicine", "clinic"], ind: "health_wellness", foc: "Ayurveda" },
    { keys: ["gst", "tax", "audit", "ca", "accounting"], ind: "finance_legal", foc: "Taxation (GST/India)" },
    { keys: ["startup", "build", "mvp", "product"], ind: "business_startups", foc: "Startup Building" },
    { keys: ["dev", "app", "web", "software", "code"], ind: "tech_software", foc: "Web Development" }
  ];

  for (const rule of directRules) {
    if (rule.keys.some(k => lower.includes(k))) {
      return { ...rule, industry: rule.ind, focus: rule.foc, confidence: 100 };
    }
  }

  // 2. Optimized Weighted Scanning
  for (const industry of INDUSTRY_DATA) {
    let baseScore = 0;
    if (lower.includes(industry.label.toLowerCase().split(' ')[0])) baseScore += 40;
    
    for (const focus of industry.focusAreas) {
      let focusScore = baseScore;
      const lowFocus = focus.toLowerCase();
      
      if (lower.includes(lowFocus)) focusScore += 80;
      
      if (focusScore > bestMatch.confidence) {
        bestMatch = { industry: industry.id, focus: focus, confidence: focusScore };
      }
      if (bestMatch.confidence >= 100) break;
    }
    if (bestMatch.confidence >= 100) break;
  }

  bestMatch.confidence = Math.min(bestMatch.confidence, 100);

  if (bestMatch.confidence >= 70) return bestMatch;
  if (bestMatch.confidence > 30) return { ...bestMatch, isPartial: true };
  
  return null;
};
