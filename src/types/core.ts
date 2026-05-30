export type Role = "STUDENT" | "PROFESSIONAL" | "ADVISOR" | "BUSINESS" | "CREATOR";

export interface UserProfile {
  id: string;
  full_name: string;
  role: Role;
  avatar_url: string;
  location: string;
  expertise: string[];
  intents: string[];
  bio: string;
  onboarding_completed?: boolean;
  company_name?: string;
  business_type?: string;
  industry?: string;
  phone?: string;
  experience_years?: number;
  experience_months?: number;
  matchScore?: number;
}

export interface Entity {
  id: string;
  type: "ADVISOR" | "BUSINESS" | "LISTING" | "COMMUNITY" | "EVENT" | "USER";
  name: string;
  description: string;
  category: string;
  location: string;
  expertise: string[];
  tags: string[];
  logo?: string;
  avatar?: string;
  matchScore: number;
  metadata?: Record<string, any>;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  status: "PENDING" | "CONNECTED" | "IGNORED";
  message?: string;
  timestamp: string;
}
