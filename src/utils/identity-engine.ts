/**
 * IDENTITY ENGINE v2.0 - WORLD-SCALE DATABASE
 * Comprehensive mapping of global professional roles, industries, and focus areas.
 * Derived from ISIC/NAICS standards for universal coverage.
 */

export const ROLE_TO_INDUSTRY: Record<string, string[]> = {
  // --- TECHNOLOGY & DIGITAL ---
  "developer": ["Technology", "Software"],
  "engineer": ["Engineering", "Technology"],
  "data scientist": ["Technology", "Data Science"],
  "ai specialist": ["Technology", "Artificial Intelligence"],
  "web designer": ["Technology", "Creative"],
  "cybersecurity": ["Technology", "Security"],
  "cloud architect": ["Technology", "Infrastructure"],
  "blockchain": ["Technology", "Web3"],
  "product manager": ["Technology", "Business"],
  "devops": ["Technology", "Operations"],
  "system admin": ["Technology", "IT Services"],
  "hardware engineer": ["Technology", "Manufacturing"],
  
  // --- CREATIVE, ARTS & MEDIA ---
  "artist": ["Creative Arts"],
  "designer": ["Creative Arts", "Design"],
  "writer": ["Media & Publishing"],
  "editor": ["Media & Publishing"],
  "photographer": ["Media & Entertainment", "Creator Economy"],
  "filmmaker": ["Media & Entertainment", "Creator Economy"],
  "musician": ["Media & Entertainment"],
  "animator": ["Creative Arts", "Technology"],
  "journalist": ["Media & Publishing"],
  "architect": ["Architecture & Planning"],
  "interior designer": ["Architecture & Planning", "Design"],
  "fashion designer": ["Fashion & Apparel"],
  "model": ["Fashion & Apparel", "Creator Economy"],
  "actor": ["Media & Entertainment"],
  "influencer": ["Creator Economy", "Media & Entertainment"],
  "content creator": ["Creator Economy"],
  "youtuber": ["Creator Economy", "Media & Entertainment"],
  "streamer": ["Creator Economy", "Media & Entertainment"],
  "tiktoker": ["Creator Economy", "Media & Entertainment"],
  
  // --- BUSINESS, FINANCE & LEGAL ---
  "founder": ["Entrepreneurship"],
  "ceo": ["Management"],
  "cfo": ["Finance"],
  "accountant": ["Finance"],
  "investment banker": ["Finance"],
  "trader": ["Finance"],
  "consultant": ["Management", "Advisory"],
  "lawyer": ["Legal Services"],
  "attorney": ["Legal Services"],
  "paralegal": ["Legal Services"],
  "hr manager": ["Human Resources"],
  "recruiter": ["Human Resources"],
  "marketer": ["Marketing & Advertising"],
  "sales": ["Sales & Commerce"],
  "banker": ["Finance", "Banking"],
  "broker": ["Finance", "Real Estate"],
  "auditor": ["Finance", "Legal Services"],
  "analyst": ["Management", "Finance"],
  
  // --- HEALTHCARE & WELLNESS ---
  "doctor": ["Healthcare"],
  "nurse": ["Healthcare"],
  "surgeon": ["Healthcare"],
  "dentist": ["Healthcare"],
  "pharmacist": ["Healthcare", "Pharmaceuticals"],
  "therapist": ["Healthcare", "Wellness"],
  "psychologist": ["Healthcare", "Wellness"],
  "nutritionist": ["Wellness"],
  "fitness trainer": ["Wellness", "Sports"],
  "veterinarian": ["Healthcare"],
  "biomedical": ["Healthcare", "Science"],
  
  // --- EDUCATION & RESEARCH ---
  "teacher": ["Education"],
  "professor": ["Education", "Academia"],
  "researcher": ["Science", "Academia"],
  "scientist": ["Science"],
  "librarian": ["Education"],
  "coach": ["Education", "Advisory"],
  "tutor": ["Education"],
  "academic": ["Academia"],
  
  // --- INDUSTRIAL, MANUFACTURING & ENERGY ---
  "factory manager": ["Manufacturing"],
  "technician": ["Manufacturing", "IT Services"],
  "mechanic": ["Automotive", "Engineering"],
  "electrician": ["Construction", "Energy"],
  "plumber": ["Construction"],
  "carpenter": ["Construction"],
  "civil engineer": ["Engineering", "Construction"],
  "miner": ["Mining & Metals"],
  "oil gas": ["Energy", "Natural Resources"],
  "renewable energy": ["Energy", "Environment"],
  "chemical engineer": ["Engineering", "Chemicals"],
  "logistics": ["Logistics & Supply Chain"],
  "warehouse": ["Logistics & Supply Chain"],
  
  // --- HOSPITALITY, TRAVEL & FOOD ---
  "chef": ["Food & Beverage"],
  "waiter": ["Food & Beverage"],
  "hotel manager": ["Hospitality & Tourism"],
  "travel agent": ["Hospitality & Tourism"],
  "pilot": ["Aviation"],
  "flight attendant": ["Aviation"],
  "tour guide": ["Hospitality & Tourism"],
  "bartender": ["Food & Beverage"],
  
  // --- AGRICULTURE & NATURAL RESOURCES ---
  "farmer": ["Agriculture"],
  "agronomist": ["Agriculture", "Science"],
  "fisherman": ["Agriculture"],
  "forester": ["Natural Resources", "Environment"],
  "environmentalist": ["Environment"],
  
  // --- PUBLIC SECTOR & SOCIAL IMPACT ---
  "politician": ["Government & Public Sector"],
  "civil servant": ["Government & Public Sector"],
  "diplomat": ["Government & Public Sector"],
  "firefighter": ["Public Safety"],
  "police officer": ["Public Safety"],
  "social worker": ["Social Services"],
  "non-profit": ["Social Impact"],
  "charity": ["Social Impact"],
  "activist": ["Social Impact"],
  
  // --- TRANSPORTATION & REAL ESTATE ---
  "driver": ["Transportation"],
  "real estate agent": ["Real Estate"],
  "property manager": ["Real Estate"],
  "developer real": ["Real Estate", "Construction"],
  "courier": ["Transportation", "Logistics & Supply Chain"]
};

export const ALL_INDUSTRIES = [
  "Technology", "Software", "Engineering", "Data Science", "Artificial Intelligence", 
  "Security", "Infrastructure", "Web3", "Business", "Operations", "IT Services", 
  "Manufacturing", "Creative Arts", "Design", "Media & Publishing", "Media & Entertainment", 
  "Creator Economy", "Architecture & Planning", "Fashion & Apparel", "Entrepreneurship", "Management", 
  "Finance", "Advisory", "Legal Services", "Human Resources", "Marketing & Advertising", 
  "Sales & Commerce", "Banking", "Real Estate", "Healthcare", "Pharmaceuticals", 
  "Wellness", "Sports", "Education", "Academia", "Science", "Construction", 
  "Automotive", "Energy", "Mining & Metals", "Natural Resources", "Chemicals", 
  "Logistics & Supply Chain", "Food & Beverage", "Hospitality & Tourism", "Aviation", 
  "Agriculture", "Environment", "Government & Public Sector", "Public Safety", 
  "Social Services", "Social Impact", "Transportation", "General"
];

export const INDUSTRY_TO_FOCUS: Record<string, string[]> = {
  "Technology": ["Software", "SaaS", "Cloud", "API", "Mobile", "DevOps", "UX"],
  "Software": ["Frontend", "Backend", "Fullstack", "QA", "Agile", "Microservices"],
  "Engineering": ["Mechanical", "Electrical", "Civil", "Automation", "R&D", "CAD"],
  "Data Science": ["Analytics", "Big Data", "Visualization", "Modeling", "Database"],
  "Artificial Intelligence": ["Machine Learning", "NLP", "Computer Vision", "LLMs", "Robotics"],
  "Security": ["Cybersecurity", "Compliance", "Encryption", "Pentesting", "Identity"],
  "Infrastructure": ["Networking", "Servers", "Data Centers", "Virtualization", "ITSM"],
  "Web3": ["Blockchain", "Crypto", "NFTs", "DeFi", "Smart Contracts", "DAOs"],
  "Business": ["Strategy", "Operations", "Project Mgmt", "BPM", "Transformation"],
  "Operations": ["Process", "Efficiency", "Team Mgmt", "Quality", "Workflow"],
  "IT Services": ["Support", "Managed Services", "Consulting", "Integration"],
  "Manufacturing": ["Production", "Inventory", "Lean", "Supply Chain", "Automation"],
  "Creative Arts": ["Fine Art", "Illustration", "Music", "Animation", "Film"],
  "Design": ["Graphic", "Industrial", "UX/UI", "Brand", "Product Design"],
  "Media & Publishing": ["Content", "Copywriting", "Journalism", "Books", "Editing"],
  "Media & Entertainment": ["Film", "Music", "Events", "Streaming", "Production", "Acting", "Talent"],
  "Creator Economy": ["Brand Deals", "Sponsorships", "Content Creation", "Audience Growth", "Monetization", "Merch", "Collabs"],
  "Architecture & Planning": ["Urban Planning", "Structural", "Interior", "BIM", "Sustainability"],
  "Fashion & Apparel": ["Retail", "Textiles", "Styling", "Luxury", "E-commerce", "Modeling", "Photoshoots"],
  "Entrepreneurship": ["Startups", "Venture", "Innovation", "Scaling", "Equity"],
  "Management": ["Leadership", "Executive", "Strategy", "Culture", "Change Mgmt"],
  "Finance": ["Investment", "Audit", "Tax", "Wealth Mgmt", "Capital Markets"],
  "Advisory": ["Consulting", "Coaching", "Strategy", "Mentorship", "Guidance"],
  "Legal Services": ["Corporate", "IP", "Litigation", "Compliance", "Contracts"],
  "Human Resources": ["Recruiting", "Culture", "Payroll", "Talent", "Benefits"],
  "Marketing & Advertising": ["SEO", "Ads", "Brand", "Social Media", "PR", "Analytics"],
  "Sales & Commerce": ["B2B", "Retail", "CRM", "Leads", "Account Mgmt"],
  "Banking": ["Retail Banking", "Investment", "Fintech", "Loans", "Credit"],
  "Real Estate": ["Residential", "Commercial", "Investment", "Brokerage", "Property Mgmt"],
  "Healthcare": ["Clinical", "Nursing", "Surgeons", "Public Health", "Telemedicine"],
  "Pharmaceuticals": ["R&D", "Clinical Trials", "Manufacturing", "Sales", "Biotech"],
  "Wellness": ["Fitness", "Mental Health", "Yoga", "Nutrition", "Spa"],
  "Sports": ["Athletics", "Management", "Coaching", "Sponsorship", "Broadcasting"],
  "Education": ["K-12", "Higher Ed", "EdTech", "Curriculum", "Training"],
  "Academia": ["Research", "Publishing", "Grants", "Conferences", "Lectures"],
  "Science": ["Physics", "Biology", "Chemistry", "Research", "Lab Ops"],
  "Construction": ["Architecture", "Contracting", "Materials", "Structural", "Safety"],
  "Automotive": ["Design", "Manufacturing", "Sales", "Repair", "Electric Vehicles"],
  "Energy": ["Oil & Gas", "Renewables", "Solar", "Nuclear", "Utilities"],
  "Mining & Metals": ["Exploration", "Excavation", "Refining", "Safety", "Logistics"],
  "Natural Resources": ["Timber", "Water", "Conservation", "Management"],
  "Chemicals": ["Industrial", "Petrochemical", "Materials", "Lab Research"],
  "Logistics & Supply Chain": ["Shipping", "Warehousing", "Inventory", "Last Mile", "Freight"],
  "Food & Beverage": ["Culinary", "Restaurant Ops", "Catering", "Wine", "Food Tech"],
  "Hospitality & Tourism": ["Travel", "Hotels", "Tour Ops", "Customer Service", "Events"],
  "Aviation": ["Pilots", "Maintenance", "Aerospace", "Airports", "Safety"],
  "Agriculture": ["Farming", "Agronomy", "Livestock", "Sustainability", "Equipment"],
  "Environment": ["Conservation", "Climate", "ESG", "Renewables", "Ecology"],
  "Government & Public Sector": ["Policy", "Diplomacy", "Administration", "Elections"],
  "Public Safety": ["Police", "Fire", "EMS", "Military", "Emergency Mgmt"],
  "Social Services": ["Social Work", "Community", "Counseling", "Advocacy"],
  "Social Impact": ["NGOs", "Philanthropy", "Sustainability", "Grants"],
  "General": ["Networking", "Advice", "Mentorship", "Opportunities", "Collaboration"],
  "Transportation": ["Public Transit", "Logistics", "Autonomous", "Fleet Mgmt"]
};

export const GLOBAL_TRENDING_FOCUS = [
  "Strategy", "Scaling", "Funding", "Hiring", "Branding", "Content", "Networking", 
  "Product", "Growth", "Ads", "SEO", "PR", "Investment", "Compliance", "IP", 
  "Research", "Telehealth", "EdTech", "Mentorship", "Sustainability", "Innovation",
  "Design", "UX/UI", "Analytics", "Automation", "E-commerce", "B2B", "Crypto", "Web3",
  "Collabs", "Sponsorships", "Content Creation"
];

export interface DetectionResult {
  industries: string[];
  confidence: number;
}

export const detectIndustry = (roleText: string): DetectionResult => {
  const normalized = roleText.toLowerCase().trim();
  if (normalized.length < 2) return { industries: [], confidence: 0 };

  const matches: string[] = [];
  let maxMatchLength = 0;

  for (const [role, industries] of Object.entries(ROLE_TO_INDUSTRY)) {
    if (normalized.includes(role)) {
      matches.push(...industries);
      maxMatchLength = Math.max(maxMatchLength, role.length);
    }
  }

  const uniqueIndustries = Array.from(new Set(matches));
  const confidence = Math.min((maxMatchLength / normalized.length) + 0.2, 1.0);

  return { 
    industries: uniqueIndustries, 
    confidence: uniqueIndustries.length > 0 ? confidence : 0 
  };
};
