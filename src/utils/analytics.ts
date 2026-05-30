/**
 * Checkout OS Analytics Engine (V2 - Production Monitoring)
 * Purpose: Track core user behavior, funnel conversion, and critical safety signals.
 */
import { createClient } from "@/utils/supabase/client";

export type EventType = 
  | 'USER_SIGNUP'
  | 'USER_VERIFIED'
  | 'ONBOARDING_COMPLETED'
  | 'REQUIREMENT_CREATED'
  | 'POST_CREATED'
  | 'CONNECTION_SENT'
  | 'SESSION_START'
  | 'SCREEN_VIEW'
  | 'AUTH_TIMEOUT'
  | 'PROFILE_FETCH_FAILURE'
  | 'ROUTING_FALLBACK'
  | 'LOW_ACTIVITY_PROMPT'
  | 'POST_CLICK'
  | 'REPLY_SENT'
  | 'CONNECTION_ACCEPTED'
  | 'SUCCESSFUL_REPLY';

interface EventData {
  userId?: string;
  timestamp: number;
  metadata?: any;
}

class AnalyticsEngine {
  private static instance: AnalyticsEngine;
  private startTime: number = typeof window !== 'undefined' ? Date.now() : 0;
  private firstActionTaken: boolean = false;
  private sessionEvents: EventType[] = [];

  private constructor() {}

  public static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine();
    }
    return AnalyticsEngine.instance;
  }

  public async track(event: EventType, userId?: string, metadata: any = {}) {
    if (typeof window === 'undefined') return;

    const timestamp = Date.now();
    const eventData: EventData = {
      userId,
      timestamp,
      metadata: {
        ...metadata,
        timeSinceStart: timestamp - this.startTime,
      }
    };

    this.sessionEvents.push(event);

    //  SYNC USER ID TO INSTANCE
    if (userId) {
      this.startTime = Date.now(); // Reset session start on identity
    }

    // STRUCTURED LOGGING
    if (process.env.NODE_ENV === 'development') {
      // Quiet logs for anonymous initial handshake
      if (!userId && (event === 'SESSION_START' || event === 'SCREEN_VIEW')) return;
      
      console.log(`%c[ANALYTICS] ${event}`, 'color: #E53935; font-weight: bold;', eventData);
    } else {
      // PRODUCTION MONITORING LOG
      console.log(`[MONITORING] ${event} | User: ${userId || 'anonymous'}`);
    }
    
    // PERSIST TO SUPABASE
    try {
      // Temporarily disabled to prevent 400 Bad Request network errors on V1 database schema
      /*
      const supabase = createClient();
      const { error } = await supabase.from('analytics_events').insert([{
        user_id: userId || null,
        event_type: event,
        metadata: {
          ...eventData.metadata,
          persisted_at: new Date().toISOString()
        }
      }]);
      
      // Silent failure for analytics persistence in development
      if (error && process.env.NODE_ENV === 'development') return;
      */
    } catch (err: any) {
      // Definitive silence for analytics infrastructure
    }
  }

  public trackScreen(screenName: string, userId?: string) {
    this.track('SCREEN_VIEW', userId, { screenName });
  }

  public getSessionEvents(): EventType[] {
    return this.sessionEvents;
  }

  public hasAction(events: EventType[]): boolean {
    return this.sessionEvents.some(e => events.includes(e));
  }

  /**
   *  SYNERGY LEARNING LAYER (V5)
   * Tracks user interaction between base tags to build a dynamic interest map.
   */
  public trackInteraction(userBase: string, postBase: string, type: 'CLICK' | 'CONNECT' | 'REPLY') {
    if (typeof window === 'undefined' || !userBase || !postBase) return;

    const STORAGE_KEY = `checkout_synergy_${userBase}`;
    const synergyMap = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    // 1. Initialize or Update Unique Signal Map
    const current = synergyMap[postBase] || { 
      signals: { CLICK: false, CONNECT: false, REPLY: false }, 
      score: 0, 
      lastInteracted: Date.now() 
    };
    
    // 2. Mark Unique Signal (Prevents raw volume drift)
    if (type === 'CLICK') current.signals.CLICK = true;
    if (type === 'CONNECT') current.signals.CONNECT = true;
    if (type === 'REPLY') current.signals.REPLY = true;

    // 3. Build Dynamic Score based on unique signals
    // Threshold: Connect or Reply required for significant influence
    let score = 0;
    if (current.signals.REPLY) score = 0.8;
    else if (current.signals.CONNECT) score = 0.6;
    else if (current.signals.CLICK) score = 0.2;

    current.score = score;
    current.lastInteracted = Date.now();
    
    synergyMap[postBase] = current;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(synergyMap));

    console.log(`%c[LEARNING] Unique Signal Recorded: ${userBase}  ${postBase} | High Intent: ${current.signals.REPLY || current.signals.CONNECT}`, 'color: #34C759; font-weight: bold;');
  }

  public getDynamicSynergy(userBase: string): Record<string, { score: number, hasHighIntent: boolean }> {
    if (typeof window === 'undefined') return {};
    
    const STORAGE_KEY = `checkout_synergy_${userBase}`;
    const synergyMap = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const now = Date.now();
    const finalMap: Record<string, any> = {};

    Object.entries(synergyMap).forEach(([base, data]: [string, any]) => {
      const ageDays = (now - data.lastInteracted) / (1000 * 60 * 60 * 24);
      let decayedScore = data.score;
      
      if (ageDays > 30) decayedScore *= 0.5;
      else if (ageDays > 7) decayedScore *= 0.9;

      if (decayedScore >= 0.1) {
        finalMap[base] = {
          score: decayedScore,
          hasHighIntent: data.signals.REPLY || data.signals.CONNECT
        };
      }
    });

    return finalMap;
  }

  /**
   *  REINFORCEMENT LAYER (V13)
   * Tracks successful professional outcomes to reinforce winning behaviors.
   */
  public trackSuccess(userBase: string, postBase: string, type: 'ACCEPT' | 'REPLY') {
    if (typeof window === 'undefined' || !userBase || !postBase) return;

    const STORAGE_KEY = `checkout_success_${userBase}`;
    const successMap = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    const current = successMap[postBase] || { count: 0, lastSuccess: Date.now() };
    current.count += 1;
    current.lastSuccess = Date.now();
    
    successMap[postBase] = current;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(successMap));

    console.log(`%c[SUCCESS] Behavioral Reinforcement: ${userBase}  ${postBase} | Total Wins: ${current.count}`, 'color: #34C759; font-weight: bold;');
  }

  public getSuccessInsights(userBase: string): { topCategory: string | null, insights: string[] } {
    if (typeof window === 'undefined') return { topCategory: null, insights: [] };
    
    const STORAGE_KEY = `checkout_success_${userBase}`;
    const successMap = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    let topCategory = null;
    let maxWins = 0;
    const insights: string[] = [];

    Object.entries(successMap).forEach(([base, data]: [string, any]) => {
      if (data.count > maxWins) {
        maxWins = data.count;
        topCategory = base;
      }
    });

    if (topCategory) {
      insights.push(`You get more replies from ${topCategory} posts`);
    }

    // Add session-based insight
    const sessionConnections = this.sessionEvents.filter(e => e === 'CONNECTION_SENT').length;
    if (sessionConnections >= 3) {
      insights.push(`You made ${sessionConnections} strong connections today`);
    }

    return { topCategory, insights };
  }
}

export const analytics = AnalyticsEngine.getInstance();
