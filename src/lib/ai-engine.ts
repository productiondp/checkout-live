import { OpenAI } from 'openai';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

/**
 * AI ENGINE SERVICE - PRODUCTION (V8)
 * Integrates real OpenAI structured outputs for project generation and market analysis.
 */

// Fallback checking so the build doesn't hard-crash if the key is missing in development
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: OPENAI_API_KEY is missing. AI Features will throw an error when invoked.");
}

const openai = new OpenAI({ apiKey: apiKey || 'dummy-key' });

// 1. Define Zod Schemas for Structural Enforcement
const ProjectGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(['INFLUENCER', 'CONTENT_CREATOR', 'UGC_CREATOR', 'PHOTOGRAPHER', 'VIDEOGRAPHER', 'EDITOR', 'MODEL', 'AGENCY', 'OTHER']),
  skills_required: z.array(z.string()),
  suggested_budget: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string()
  }),
  timeline: z.string(),
  deliverables: z.array(z.string())
});

const PortfolioReviewSchema = z.object({
  optimization_score: z.number().min(0).max(100),
  missing_skills: z.array(z.string()),
  missing_categories: z.array(z.string()),
  suggestions: z.array(z.string())
});

export const AIEngine = {
  
  /**
   * Translates a raw prompt into a structured Opportunity ready for insertion.
   */
  async generateProjectFromPrompt(prompt: string) {
    if (!apiKey) throw new Error("OpenAI integration is missing API Key configuration.");

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective model for structuring
        messages: [
          { role: "system", content: "You are an expert creator economy matching assistant. Parse the user's raw request and structure it into a professional project brief." },
          { role: "user", content: prompt }
        ],
        response_format: zodResponseFormat(ProjectGenerationSchema, "project_schema"),
        temperature: 0.2
      });

      const parsedContent = response.choices[0].message.content;
      if (!parsedContent) throw new Error("Failed to generate project structure.");

      return JSON.parse(parsedContent);
    } catch (error) {
      console.error("[AI Engine Error]:", error);
      throw new Error("AI Project Generation failed.");
    }
  },

  /**
   * Reviews a Creator's existing portfolio against current market trends.
   */
  async reviewPortfolio(creatorId: string) {
    if (!apiKey) throw new Error("OpenAI integration is missing API Key configuration.");

    const supabase = createClient();
    const { data: creator } = await supabase.from('creator_profiles').select('*').eq('id', creatorId).single();
    
    if (!creator) throw new Error("Creator not found");

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert talent manager. Review this creator's profile data and provide actionable suggestions to increase their hire rate." },
          { role: "user", content: JSON.stringify(creator) }
        ],
        response_format: zodResponseFormat(PortfolioReviewSchema, "review_schema"),
        temperature: 0.3
      });

      const parsedContent = response.choices[0].message.content;
      if (!parsedContent) throw new Error("Failed to generate portfolio review.");

      return JSON.parse(parsedContent);
    } catch (error) {
      console.error("[AI Engine Error]:", error);
      throw new Error("AI Portfolio Review failed.");
    }
  },

  // Note: predictSuccess and recommendPricing would also be converted using similar OpenAI calls.
};
