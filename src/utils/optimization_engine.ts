/**
 * Checkout OS Optimization Engine
 * Purpose: Self-optimizing system that adjusts internal weights based on product health signals.
 */
import { insights, InsightReport } from "@/utils/insights_engine";
import { createClient } from "@/utils/supabase/client";
import { healthMonitor } from "@/utils/health_monitor";
import { decisionMemory } from "@/utils/decision_memory";

export interface SystemConfig {
  weights: {
    intent: number;
    expertise: number;
    recency: number;
    location: number;
  };
  override: {
    weights: {
      intent: number;
      expertise: number;
      recency: number;
      location: number;
    } | null;
    expiresAt: number | null;
    lastOverrideEnd: number | null;
    mode: 'normal' | 'growth' | 'precision';
  };
  promptConfig: {
    ttfaThreshold: number;
    urgencyLevel: 'low' | 'medium' | 'high';
    onboardingText: string;
  };
  feedConfig: {
    maxItemsPassive: number;
    diversityFactor: number;
  };
}

const BASE_WEIGHTS = {
  intent: 0.4,
  expertise: 0.3,
  recency: 0.2,
  location: 0.1
};

const SMOOTHING_FACTOR = 0.2;
const MIN_EVENTS_REQUIRED = 100;
const OPTIMIZATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours

const DEFAULT_CONFIG: SystemConfig = {
  weights: { ...BASE_WEIGHTS },
  override: {
    weights: null,
    expiresAt: null,
    mode: 'normal'
  },
  promptConfig: {
    ttfaThreshold: 60,
    urgencyLevel: 'medium',
    onboardingText: "Posting your first requirement activates your city network."
  },
  feedConfig: {
    maxItemsPassive: 10,
    diversityFactor: 1.0
  }
};

const SAFETY_LIMITS = {
  intent: { min: 0.3, max: 0.5 },
  expertise: { min: 0.2, max: 0.4 },
  recency: { min: 0.1, max: 0.3 },
  location: { min: 0.05, max: 0.2 }
};

class OptimizationEngine {
  private static instance: OptimizationEngine;
  private config: SystemConfig = DEFAULT_CONFIG;
  private lastRunTimestamp: number = 0;

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): OptimizationEngine {
    if (!OptimizationEngine.instance) {
      OptimizationEngine.instance = new OptimizationEngine();
    }
    return OptimizationEngine.instance;
  }

  private loadConfig() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('checkout_system_config');
    const savedTime = localStorage.getItem('checkout_last_opt_run');
    if (saved) {
      try {
        this.config = JSON.parse(saved);
        this.lastRunTimestamp = savedTime ? parseInt(savedTime) : 0;
      } catch (err) {
        console.error('Failed to parse system config', err);
      }
    }
  }

  private saveConfig() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('checkout_system_config', JSON.stringify(this.config));
    localStorage.setItem('checkout_last_opt_run', this.lastRunTimestamp.toString());
  }

  public async run() {
    // 0. Check for Pause Flag (from Health Monitor)
    if (localStorage.getItem('checkout_opt_paused') === 'true') {
      console.warn('[OPTIMIZATION] Paused: System degradation detected. Using baseline weights.');
      this.resetToBaseline();
      return;
    }

    const now = Date.now();
    
    // 0.1 Handle Override Expiration
    if (this.config.override.expiresAt && now > this.config.override.expiresAt) {
      console.log('[CONTROL OVERRIDE] Manual weights expired. Reverting to automated tuning.');
      this.config.override.lastOverrideEnd = this.config.override.expiresAt;
      this.config.override.weights = null;
      this.config.override.expiresAt = null;
      this.saveConfig();

      // Trigger Outcome Evaluation
      insights.generateReport().then((report: any) => {
        if (report) {
           decisionMemory.evaluatePendingOutcomes({
              timestamp: now,
              activation_rate: parseFloat(report.activation_rate),
              avg_ttfa: parseFloat(report.avg_ttfa),
              connection_success_rate: parseFloat(report.connection_success),
              feed_ctr: parseFloat(report.feed_ctr)
           });
        }
      });
    }

    // 1. Throttle: Only run once per interval
    if (now - this.lastRunTimestamp < OPTIMIZATION_INTERVAL_MS) {
      return;
    }

    const { data: eventCount } = await createClient()
      .from('analytics_events')
      .select('id', { count: 'exact', head: true });

    // 2. Data Threshold Check
    if ((eventCount || 0) < MIN_EVENTS_REQUIRED) {
      return;
    }

    const report = await insights.generateReport();
    if (!report) return;

    console.log('[OPTIMIZATION] Starting system recalibration...');
    this.optimizeWeights(report);
    this.optimizePrompts(report);
    this.optimizeFeed(report);
    
    this.lastRunTimestamp = now;
    this.saveConfig();
  }

  private optimizeWeights(report: InsightReport) {
    // Skip automated weight tuning if manual override is active
    if (this.config.override.weights) {
      console.log('[OPTIMIZATION] Automated weight tuning bypassed: Manual Override active.');
      return;
    }

    const currentWeights = { ...this.config.weights };
    const targetWeights = { ...BASE_WEIGHTS };

    // Connection Success Optimization
    const connSuccess = parseFloat(report.connection_success);
    if (connSuccess < 25) {
      targetWeights.expertise += 0.05;
      targetWeights.intent += 0.02;
      targetWeights.recency -= 0.05;
    }

    // Feed CTR Optimization
    const feedCtr = parseFloat(report.feed_ctr);
    if (feedCtr < 10) {
      targetWeights.intent += 0.05;
      targetWeights.recency -= 0.05;
    }

    // Apply Smoothing & Safety Limits relative to Baseline
    Object.keys(currentWeights).forEach((key: any) => {
      const k = key as keyof typeof BASE_WEIGHTS;
      const step = (targetWeights[k] - currentWeights[k]) * SMOOTHING_FACTOR;
      let newWeight = currentWeights[k] + step;
      newWeight = Math.max(SAFETY_LIMITS[k].min, Math.min(SAFETY_LIMITS[k].max, newWeight));
      currentWeights[k] = newWeight;
    });

    this.config.weights = currentWeights;
  }

  private optimizePrompts(report: InsightReport) {
    const ttfa = parseFloat(report.avg_ttfa);
    if (ttfa > 60) {
      this.config.promptConfig.urgencyLevel = 'high';
      this.config.promptConfig.onboardingText = "Post your first requirement now to activate your network and unlock city matches.";
    } else {
      this.config.promptConfig.urgencyLevel = 'medium';
    }
  }

  private optimizeFeed(report: InsightReport) {
    if (report.top_performing_module === 'None') {
      this.config.feedConfig.diversityFactor = 1.5;
    } else {
      this.config.feedConfig.diversityFactor = 0.8;
    }
  }

  public setWeights(
    weights: Partial<typeof BASE_WEIGHTS>, 
    reason: string, 
    expectedOutcome: string,
    durationHours: number = 24
  ) {
    const now = Date.now();
    
    // 1. Cooling Period Check (24h)
    if (this.config.override.lastOverrideEnd && (now - this.config.override.lastOverrideEnd < 24 * 60 * 60 * 1000)) {
      console.error('[OVERRIDE REJECTED] System is in cooling period. Observe metrics for 24-48h after previous change.');
      return;
    }

    // 2. Single Variable Rule
    const keysChanged = Object.keys(weights);
    if (keysChanged.length > 1) {
      console.error('[OVERRIDE REJECTED] Adjust only ONE factor at a time (intent OR expertise OR recency).');
      return;
    }
    const variable = keysChanged[0];

    // 2.1 Decision Assist: Check patterns
    const rec = decisionMemory.getRecommendation(variable, (weights as any)[variable]);
    if (rec.warning) {
       console.warn(`%c[DECISION ASSIST] ${rec.warning}`, "color: #FFA000; font-weight: bold;");
    }

    // 3. Duration Limit (Max 48h)
    const finalDuration = Math.min(durationHours, 48);

    const prevWeights = { ...(this.config.override.weights || this.config.weights) };
    const newWeights = { ...prevWeights, ...weights };
    
    // Safety Bounds Check
    Object.keys(newWeights).forEach((key: any) => {
      const k = key as keyof typeof BASE_WEIGHTS;
      newWeights[k] = Math.max(SAFETY_LIMITS[k].min, Math.min(SAFETY_LIMITS[k].max, newWeights[k]));
    });

    // 4. Record Decision
    insights.generateReport().then(report => {
       const metrics = report ? {
          timestamp: now,
          activation_rate: parseFloat(report.activation_rate),
          avg_ttfa: parseFloat(report.avg_ttfa),
          connection_success_rate: parseFloat(report.connection_success),
          feed_ctr: parseFloat(report.feed_ctr)
       } : null;

       decisionMemory.recordDecision({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: now,
          variable,
          prevValue: (prevWeights as any)[variable],
          newValue: (weights as any)[variable],
          reason,
          expectedOutcome,
          duration: finalDuration
       }, metrics);
    });

    this.config.override.weights = newWeights;
    this.config.override.expiresAt = now + (finalDuration * 60 * 60 * 1000);
    this.saveConfig();
    
    console.log(`%c[CONTROL OVERRIDE] Manual Tuning Active`, "color: #E53935; font-weight: bold; font-size: 14px;");
    console.log(`Reason: ${reason}`);
    console.log(`Expected Outcome: ${expectedOutcome}`);
    console.log(`Duration: ${finalDuration}h`);
    console.table(newWeights);
  }

  public setPriorityMode(mode: 'normal' | 'growth' | 'precision', reason: string) {
    this.config.override.mode = mode;
    this.saveConfig();
    console.log(`%c[CONTROL OVERRIDE] Priority Shift: ${mode.toUpperCase()}`, "color: #E53935; font-weight: bold;");
    console.log(`Reason: ${reason}`);
  }

  public getConfig(): SystemConfig {
    return this.config;
  }

  public getWeights() {
    if (this.config.override.weights && (!this.config.override.expiresAt || Date.now() < this.config.override.expiresAt)) {
      return this.config.override.weights;
    }
    return this.config.weights;
  }

  public resetToBaseline() {
    this.config.weights = { ...BASE_WEIGHTS };
    this.config.override = { weights: null, expiresAt: null, mode: 'normal' };
    localStorage.removeItem('checkout_opt_paused');
    this.saveConfig();
    console.log('[OPTIMIZATION] System reset to baseline. Overrides cleared.');
  }
}

export const optimization = OptimizationEngine.getInstance();
