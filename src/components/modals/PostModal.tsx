"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  X, Zap, Target, Users, Sparkles, 
  ArrowRight, CheckCircle2, Activity,
  MapPin, Calendar, IndianRupee, Tag as TagIcon,
  Plus, Check, Clock, Briefcase, Globe,
  AlertCircle, ChevronRight, ChevronLeft, Info,
  Navigation, Search as SearchIcon, Video, Lock, Unlock,
  ShieldCheck, Star, Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { analytics } from "@/utils/analytics";
import { motion, AnimatePresence } from "framer-motion";
import { detectBaseTag } from "@/utils/match-engine";
import { ClarityTextarea } from "@/components/ui/ClarityTextarea";
import { INDUSTRY_DATA, getIndustryById, detectTaxonomy, EXPERIENCE_LEVELS, detectIntent, getIntentConfig, IntentType } from "@/utils/industry-data";
import { DEFAULT_AVATAR } from "@/utils/constants";
import PostSubmissionStatus, { SubmissionState } from "./PostSubmissionStatus";

import 'maplibre-gl/dist/maplibre-gl.css';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostSuccess?: (post: any) => void;
  editPost?: any;
  initialFormType?: 'REQUIREMENT' | 'PARTNERSHIP' | 'MEETUP';
}

const TYPE_CONFIG = {
  REQUIREMENT: {
    label: "Requirement",
    icon: Target,
    color: "bg-[#1D1D1F]",
    shadow: "shadow-black/10",
    steps: 7,
    cta: "Post Requirement"
  },
  PARTNERSHIP: {
    label: "Partner",
    icon: Sparkles,
    color: "bg-[#34C759]",
    shadow: "shadow-emerald-500/20",
    steps: 8,
    cta: "Post Partner Opportunity"
  },
  MEETUP: {
    label: "Meetup",
    icon: Users,
    color: "bg-[#E53935]",
    shadow: "shadow-red-600/20",
    steps: 9,
    cta: "Host Meetup"
  }
};

export default function PostModal({ isOpen, onClose, onPostSuccess, editPost, initialFormType = 'REQUIREMENT' }: PostModalProps) {
  const { user: authUser } = useAuth();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  
  // CORE STATE
  const [type, setType] = useState<'REQUIREMENT' | 'PARTNERSHIP' | 'MEETUP'>(
    initialFormType === 'MEETUP' ? 'MEETUP' : (initialFormType === 'PARTNERSHIP' ? 'PARTNERSHIP' : 'REQUIREMENT')
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [content, setContent] = useState("");
  const [industry, setIndustry] = useState<string>("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  
  // AUX STATE
  const [experienceLevel, setExperienceLevel] = useState<string>("Intermediate");
  const [commitment, setCommitment] = useState<string>("Active");
  const [stage, setStage] = useState<string>("Idea");
  const [timeline, setTimeline] = useState<string>("Flexible");
  const [budget, setBudget] = useState<string>("Open");
  const [budgetType, setBudgetType] = useState<string>("Fixed");
  const [location, setLocation] = useState<string>("Remote");
  const [workType, setWorkType] = useState<string>("Part-time");
  const [weeklyHours, setWeeklyHours] = useState<string>("10-20 hours");
  
  // MEETUP SPECIFIC
  const [meetupSubtype, setMeetupSubtype] = useState<'OPEN' | 'ADVISOR'>('OPEN');
  const [selectedAdvisor, setSelectedAdvisor] = useState<any>(null);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [meetupGeo, setMeetupGeo] = useState<{ lat: number, lng: number, address: string }>({
    lat: 9.9312,
    lng: 76.2673,
    address: "Kochi, Kerala"
  });
  const [meetupCapacity, setMeetupCapacity] = useState<string>("8");
  const [meetupPrice, setMeetupPrice] = useState<string>("Free");
  const [meetupFormat, setMeetupFormat] = useState<string>("In-person");
  const [meetupAccess, setMeetupAccess] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [meetupTime, setMeetupTime] = useState<string>("18:00");
  const [meetupDate, setMeetupDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [meetupDuration, setMeetupDuration] = useState<string>("1 hour");
  const [meetupPlatform, setMeetupPlatform] = useState<string>("Zoom");
  const [meetupAgenda, setMeetupAgenda] = useState<string>("");
  const [meetupTarget, setMeetupTarget] = useState<string>("");
  
  // SMART FEATURES STATE
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [suggestedIndustry, setSuggestedIndustry] = useState<any>(null);
  const [isImproving, setIsImproving] = useState(false);

  const [suggestion, setSuggestion] = useState<{ industry: string, focus: string } | null>(null);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [clarityScore, setClarityScore] = useState(0);
  const [coachTip, setCoachTip] = useState("Start by describing your need");
  const [detectedIntent, setDetectedIntent] = useState<IntentType>('GENERAL');
  const [submissionState, setSubmissionState] = useState<SubmissionState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const DRAFT_KEY = "checkout_post_draft";

  // LOAD DRAFT
  useEffect(() => {
    if (isOpen && !editPost) {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.content) setContent(draft.content);
          if (draft.type) setType(draft.type);
          if (draft.industry) setIndustry(draft.industry);
          if (draft.focusAreas) setFocusAreas(draft.focusAreas);
          if (draft.experienceLevel) setExperienceLevel(draft.experienceLevel);
          if (draft.commitment) setCommitment(draft.commitment);
          if (draft.stage) setStage(draft.stage);
          if (draft.timeline) setTimeline(draft.timeline);
          if (draft.budget) setBudget(draft.budget);
          if (draft.budgetType) setBudgetType(draft.budgetType);
          if (draft.location) setLocation(draft.location);
          if (draft.workType) setWorkType(draft.workType);
          if (draft.weeklyHours) setWeeklyHours(draft.weeklyHours);
          
          // Meetup recovery
          if (draft.meetupSubtype) setMeetupSubtype(draft.meetupSubtype);
          if (draft.meetupGeo) setMeetupGeo(draft.meetupGeo);
          if (draft.meetupCapacity) setMeetupCapacity(draft.meetupCapacity);
          if (draft.meetupPrice) setMeetupPrice(draft.meetupPrice);
          if (draft.meetupFormat) setMeetupFormat(draft.meetupFormat);
          if (draft.meetupAccess) setMeetupAccess(draft.meetupAccess);
          if (draft.meetupTime) setMeetupTime(draft.meetupTime);
          if (draft.meetupDate) setMeetupDate(draft.meetupDate);
          if (draft.meetupDuration) setMeetupDuration(draft.meetupDuration);
          if (draft.meetupAgenda) setMeetupAgenda(draft.meetupAgenda);
          if (draft.meetupTarget) setMeetupTarget(draft.meetupTarget);
          
          if (draft.currentStep) setCurrentStep(draft.currentStep);
        } catch (e) {
          console.error("Draft Recovery Failed:", e);
        }
      }
    }
  }, [isOpen, editPost]);

  // SAVE DRAFT
  useEffect(() => {
    if (isOpen && !editPost) {
      const draft = {
        content, type, industry, focusAreas, experienceLevel,
        commitment, stage, timeline, budget, budgetType,
        location, workType, weeklyHours, currentStep,
        meetupSubtype, meetupGeo, meetupCapacity, meetupPrice,
        meetupFormat, meetupAccess, meetupTime, meetupDate,
        meetupDuration, meetupAgenda, meetupTarget
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [
    isOpen, content, type, industry, focusAreas, experienceLevel,
    commitment, stage, timeline, budget, budgetType,
    location, workType, weeklyHours, currentStep,
    meetupSubtype, meetupGeo, meetupCapacity, meetupPrice,
    meetupFormat, meetupAccess, meetupTime, meetupDate,
    meetupDuration, meetupAgenda, meetupTarget
  ]);

  // RESET LOGIC
  useEffect(() => {
    if (isOpen) {
      setSubmissionState(null);
      if (editPost) {
        setContent(editPost.content || "");
        setType(editPost.type);
        setIndustry(editPost.industry || "");
        setFocusAreas(editPost.skills_required || []);
        if (editPost.type === 'MEETUP') {
          setMeetupDate(editPost.dateTime?.split(' ')[0] || "");
          setMeetupTime(editPost.dateTime?.split(' ')[1] || "");
          setMeetupPrice(editPost.payment_type || "Free");
        }
      }
    }
  }, [isOpen, editPost]);

  // OPTIMIZED: MEMOIZED INTENT & SUGGESTION LOGIC
  const { intentId, intentConfig, suggestions, score, currentTip, detectedTaxo } = useMemo(() => {
    // 1. Intent Detection
    const id = detectIntent(content);
    const config = getIntentConfig(id);

    const lowContent = content.toLowerCase();

    // 2. Contextual Suggestions
    let sug: string[] = ["What are you solving for?", "Add Objective"];
    if (config && id !== 'GENERAL') {
      sug = [...config.suggestions, "What are you solving for?"];
      
      // CREATOR ADAPTATION
      if (lowContent.includes('model') || lowContent.includes('shoot') || lowContent.includes('actor') || lowContent.includes('creator')) {
        sug = sug.map(s => s === 'Tech Stack' ? 'Shoot Location' : s);
      }
    }
    
    if (lowContent.includes("developer") || lowContent.includes("build") || lowContent.includes("mvp")) {
      if (!sug.includes("Strategic Roadmap")) sug.push("Strategic Roadmap");
    }
    if (authUser?.industry && !lowContent.includes(authUser.industry.toLowerCase())) {
      sug.push(`Relation to ${authUser.industry}`);
    }

    const filteredSuggestions = sug.filter(s => !content.includes(s)).slice(0, 3);

    // 3. Clarity & Taxonomy
    let sIndustry = null;
    let sScore = 0;
    let sTip = "Start by describing your need";

    if (content.length > 5) {
      if (!industry) {
        sIndustry = detectTaxonomy(content);
      }

      if (content.length > 20) sScore += 30;
      if (content.length > 60) sScore += 20;
      if (id !== 'GENERAL') sScore += 20;
      if (lowContent.includes("objective") || lowContent.includes("launch")) sScore += 15;
      if (lowContent.includes("solving") || lowContent.includes("roadmap")) sScore += 15;
      sScore = Math.min(sScore, 100);

      if (sScore < 30) sTip = id !== 'GENERAL' ? `Detected ${config?.label}. Keep going!` : "Keep typing for better matches";
      else if (sScore < 50) sTip = "Structure recognized. Increasing visibility...";
      else if (sScore < 80) sTip = "Strong intent found. Experts will love this.";
      else sTip = "Perfect! This is a high-intent requirement.";
    }

    return { 
      intentId: id, 
      intentConfig: config, 
      suggestions: filteredSuggestions, 
      score: sScore, 
      currentTip: sTip,
      detectedTaxo: sIndustry
    };
  }, [content, industry, authUser]);

  // Sync memoized values to state efficiently
  useEffect(() => {
    setDetectedIntent(intentId);
    setActiveSuggestions(suggestions);
    setClarityScore(score);
    setCoachTip(currentTip);
    setSuggestedIndustry(detectedTaxo);
  }, [intentId, suggestions, score, currentTip, detectedTaxo]);

  // NEW: Requirement Geo-Resolution
  const [requirementGeo, setRequirementGeo] = useState<{ lat: number, lng: number } | null>(null);
  
  useEffect(() => {
    if (type !== 'MEETUP' && location && location !== 'Remote') {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(location + ", Trivandrum")}&limit=1`);
          const data = await res.json();
          if (data.features?.length > 0) {
            const [lng, lat] = data.features[0].geometry.coordinates;
            setRequirementGeo({ lat, lng });
          }
        } catch (err) {
          console.error("Requirement Geo-tagging failed", err);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location, type]);

  // SMART: LOCATION SEARCH (PHOTON API)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (locationQuery.length > 1) {
        setIsSearchingLocation(true);
        try {
          // Add bias if we have current lat/lng
          const bias = meetupGeo.lat ? `&lat=${meetupGeo.lat}&lon=${meetupGeo.lng}` : "";
          const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locationQuery)}&limit=5${bias}`);
          const data = await res.json();
          setLocationSuggestions(data.features || []);
        } catch (err) {
          console.error("Location search failed", err);
        } finally {
          setIsSearchingLocation(false);
        }
      } else {
        setLocationSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [locationQuery]);

  // FETCH ADVISORS
  useEffect(() => {
    if (type === 'MEETUP' && currentStep === 4 && meetupSubtype === 'ADVISOR') {
      async function fetchAdvisors() {
        const { data } = await supabase.from('profiles').select('*').limit(5);
        setAdvisors(data || []);
      }
      fetchAdvisors();
    }
  }, [currentStep, type, meetupSubtype]);

  // MAP INITIALIZATION
  useEffect(() => {
    if (type === 'MEETUP' && currentStep === 5 && meetupFormat === 'In-person' && mapContainerRef.current) {
      const initMap = async () => {
        const maplibregl = (await import('maplibre-gl')).default;
        if (mapRef.current) mapRef.current.remove();
        mapRef.current = new maplibregl.Map({
          container: mapContainerRef.current!,
          style: 'https://demotiles.maplibre.org/style.json',
          center: [meetupGeo.lng, meetupGeo.lat],
          zoom: 12
        });
        const marker = new maplibregl.Marker({ draggable: true })
          .setLngLat([meetupGeo.lng, meetupGeo.lat])
          .addTo(mapRef.current);
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          setMeetupGeo(prev => ({ ...prev, lat: lngLat.lat, lng: lngLat.lng }));
        });
      };
      initMap();
    }
  }, [currentStep, type, meetupFormat]);

  const improveMessage = () => {
    // Rely on Clarity Assistant for refinement
    if (inputRef.current) {
      // Trigger refinement via the ClarityTextarea internal logic if possible
      // or just use the local simple expansion as a fallback
      setIsImproving(true);
      setTimeout(() => {
        let improved = content;
        if (content.toLowerCase().includes("need dev")) improved = content.replace(/need dev/i, "Looking for a skilled developer to build an MVP");
        else if (content.toLowerCase().includes("startup meetup")) improved = "Hosting a networking session for startup founders and early employees in Kochi";
        else if (content.length < 30) improved = `I'm looking to connect with people about ${content}. Specifically interested in finding partners for collaboration.`;
        
        setContent(improved);
        setIsImproving(false);
      }, 600);
    }
  };

  const handlePost = async () => {
    if (!authUser?.id) return;
    if (!content.trim() || !industry || focusAreas.length === 0) {
      setError("Please complete all required fields");
      return;
    }

    setSubmissionState('PREPARING');
    setError(null);

    // Confidence delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setSubmissionState('POSTING');
    const idempotencyKey = `${authUser.id}-${Date.now()}`;
    
    const payload = {
      author_id: authUser.id,
      industry,
      type,
      title: content.split('\n')[0].substring(0, 60) || "New Post",
      content,
      location: type === 'MEETUP' ? (meetupFormat === 'Online' ? meetupPlatform : meetupGeo.address) : location,
      budget: type === 'REQUIREMENT' ? (budget === 'Open' ? 'Open' : `${budget} (${budgetType})`) : (type === 'MEETUP' ? meetupPrice : null),
      due_date: timeline === "ASAP" ? new Date().toISOString() : null,
      skills_required: focusAreas,
      partnershipType: type === 'PARTNERSHIP' ? focusAreas[0] : null,
      commitmentLevel: type === 'PARTNERSHIP' ? commitment.toUpperCase() : null,
      max_slots: type === 'MEETUP' ? parseInt(meetupCapacity) || 8 : 1,
      payment_type: type === 'MEETUP' ? meetupPrice : 'Free',
      context: idempotencyKey,
      dateTime: type === 'MEETUP' ? `${meetupDate} ${meetupTime}` : null,
      metadata: {
        focus_areas: focusAreas,
        experience_level: experienceLevel,
        stage: stage.toLowerCase(),
        commitment: commitment,
        duration: type === 'MEETUP' ? meetupDuration : null,
        meetup_type: type === 'MEETUP' ? meetupSubtype : null,
        advisor_id: selectedAdvisor?.id,
        geo: type === 'MEETUP' ? { lat: meetupGeo.lat, lng: meetupGeo.lng } : (requirementGeo || (location === 'Remote' ? null : { lat: HUB_LAT, lng: HUB_LNG, is_approximate: true })),
        access: type === 'MEETUP' ? meetupAccess : 'OPEN',
        agenda: type === 'MEETUP' ? meetupAgenda : null,
        target_audience: type === 'MEETUP' ? meetupTarget : null,
        is_visible: type === 'MEETUP' && meetupSubtype === 'ADVISOR' ? false : true
      }
    };

    try {
      const { data, error: postErr } = editPost 
        ? await supabase.from('posts').update(payload).eq('id', editPost.id).select().single()
        : await supabase.from('posts').insert([payload]).select().single();
      if (postErr) throw postErr;
      
      setSubmissionState('SUCCESS');
      localStorage.removeItem(DRAFT_KEY);
      
      // Register for auto-scroll and highlight in Feed
      localStorage.setItem('checkout_last_post', JSON.stringify({
        title: payload.title,
        time: Date.now()
      }));

      // Show success for 2 seconds before closing
      setTimeout(() => {
        onPostSuccess?.(data);
        onClose();
        setSubmissionState(null);
      }, 2000);

    } catch (err: any) {
      console.error("[COMPOSER_FATAL_ERROR] Database rejected the payload:", err);
      if (err.details) console.error("Error Details:", err.details);
      if (err.hint) console.error("Error Hint:", err.hint);
      setSubmissionState('FAILED');
      setError(err.message || "Failed to post. Please try again.");
    }
  };

  const config = TYPE_CONFIG[type];
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-safe">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 100, scale: 1 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        exit={{ opacity: 0, y: 100 }}
        className="relative w-full sm:w-[90%] sm:max-w-xl bg-white rounded-t-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-auto max-h-[92vh] sm:max-h-[95vh]"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between shrink-0 p-6 md:p-8 lg:p-10 pb-4 border-b border-black/[0.03]">
           <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all", config.color, config.shadow)}>
                 <config.icon size={20} />
              </div>
              <h2 className="text-xl font-black italic tracking-tight text-[#1D1D1F] uppercase">{config.label}</h2>
           </div>
           <button onClick={onClose} className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
             <X size={20} />
           </button>
        </div>

        {/* SELECTOR */}
        {currentStep === 1 && (
           <div className="flex gap-2 p-1 bg-slate-50 border border-black/[0.03] rounded-2xl shrink-0">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setType(key as any); setCurrentStep(1); }}
                  className={cn(
                    "flex-1 h-11 rounded-xl flex items-center justify-center gap-2.5 text-[9px] font-black uppercase transition-all",
                    type === key ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <cfg.icon size={12} />
                  {cfg.label}
                </button>
              ))}
           </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 lg:p-10 pt-4">
          <AnimatePresence mode="wait">
             <motion.div
               key={`${type}-${currentStep}`}
               initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
               className="space-y-6 pb-2"
             >
                {/* STEP 1: WHAT */}
                {currentStep === 1 && (
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-none text-[#1D1D1F]">
                           {type === 'MEETUP' ? "What is this meetup about?" : 
                            type === 'PARTNERSHIP' ? "What are you trying to build?" : 
                            "What do you need help with?"}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Keep it simple and clear</p>
                      </div>
                      
                        <div className="space-y-4 md:space-y-6">
                          <ClarityTextarea
                            ref={inputRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={
                              type === 'MEETUP' ? (authUser?.role === 'CREATOR' ? "E.g. Content Creator Meetup at Fort Kochi..." : "E.g. Coffee & Code at Kochi Marina...") : 
                              type === 'PARTNERSHIP' ? (authUser?.role === 'CREATOR' ? "E.g. Looking for a videographer for a 3-day shoot..." : "E.g. Building a fintech startup for Kerala...") : 
                              (authUser?.role === 'CREATOR' ? "E.g. Open for brand deals and UGC content..." : "E.g. Need a senior dev for a 2-week sprint...")
                            }
                            type={type}
                            className="min-h-[220px] md:min-h-[260px] text-base md:text-lg p-6 md:p-8 bg-slate-50 border-none rounded-[2rem] md:rounded-[2.5rem] focus:ring-4 focus:ring-black/5 transition-all"
                          />

                          {/* UNIFIED INTELLIGENCE HUB - PREMIUM & RESPONSIVE */}
                          <div className="bg-slate-50/50 backdrop-blur-sm rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-black/[0.03] space-y-5 md:space-y-6 shadow-sm">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                   <div className="h-8 w-8 md:h-10 md:w-10 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-[#FF3B30] shadow-sm border border-black/[0.02] shrink-0">
                                      <Sparkles size={18} className="md:size-20" />
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#1A1A1A] leading-tight">{coachTip}</span>
                                      {detectedIntent !== 'GENERAL' && (
                                         <div className="flex items-center gap-2 mt-1">
                                            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", getIntentConfig(detectedIntent)?.color.replace('text-', 'bg-'))} />
                                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", getIntentConfig(detectedIntent)?.color)}>
                                               {getIntentConfig(detectedIntent)?.label}
                                            </span>
                                         </div>
                                      )}
                                   </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-4 bg-white/40 p-2 px-4 rounded-xl border border-black/[0.02]">
                                   <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Clarity Score</span>
                                   <div className="h-1.5 w-16 md:w-20 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#FF3B30] transition-all duration-500 shadow-[0_0_10px_rgba(255,59,48,0.3)]" style={{ width: `${clarityScore}%` }} />
                                   </div>
                                </div>
                             </div>

                             <div className="flex flex-wrap gap-2 md:gap-3">
                                {activeSuggestions.map((s, i) => (
                                  <div key={s} className="relative">
                                    <motion.button
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: i * 0.1 }}
                                      onClick={() => setActiveMenu(activeMenu === s ? null : s)}
                                      className={cn(
                                        "h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 md:gap-3 whitespace-nowrap shadow-sm",
                                        activeMenu === s ? "bg-[#FF3B30] text-white border-[#FF3B30] shadow-lg shadow-red-500/10" : "bg-white text-slate-500 border-black/[0.05] hover:border-black/10"
                                      )}
                                    >
                                      {s === "What are you solving for?" ? <Activity size={12} /> : <Target size={12} />}
                                      {s}
                                      <Plus size={10} className={cn("transition-transform duration-300", activeMenu === s && "rotate-45")} />
                                    </motion.button>

                                    <AnimatePresence>
                                      {activeMenu === s && (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                          className="absolute bottom-full left-0 mb-3 w-72 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.2)] border border-black/[0.03] p-5 z-[200] space-y-2 backdrop-blur-xl"
                                        >
                                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 px-2 pb-2">Select to Apply</p>
                                          {( (getIntentConfig(detectedIntent)?.suggestions.includes(s) || s === "What are you solving for?") ? (
                                            (() => {
                                              switch(s) {
                                                // HIRING
                                                case 'Role Responsibility': 
                                                  if (content.toLowerCase().includes('model') || content.toLowerCase().includes('shoot') || content.toLowerCase().includes('actor')) {
                                                    return ['Modeling / Acting', 'Fashion Shoot', 'Brand Ambassador', 'UGC Content Creation', 'Promo Video', 'Voiceover / Audio', 'Event Hosting', 'Product Demo'];
                                                  }
                                                  return ['Lead Development', 'Design UI/UX', 'Manage Campaigns', 'Content Creation', 'Sales & Outreach', 'Operations & Admin', 'Data Analytics', 'Customer Support'];
                                                case 'Experience Required': return ['Intern / Fresher', 'Junior (1-2y)', 'Mid-level (3-5y)', 'Senior (5-8y)', 'Lead (8y+)', 'Expert / Principal', 'Freelancer (Any)', 'Open to All'];
                                                case 'Budget / Salary': return ['₹5k - ₹15k/mo', '₹15k - ₹30k/mo', '₹30k - ₹70k/mo', '₹70k - ₹1.5L/mo', '₹1.5L+/mo', 'Commission / Revenue Share', 'Project-based Fixed', 'Equity Only (No Cash)'];
                                                case 'Tech Stack': return ['React / Node.js', 'Python / AI / ML', 'Figma / UI Design', 'Adobe CC / Video', 'No-Code / Bubble', 'Mobile (iOS/Android)', 'Java / Spring', 'AWS / DevOps'];
                                                case 'Shoot Location': return ['Studio Shoot', 'Outdoor Location', 'Self-Shot / UGC', 'Live Event', 'Remote / Virtual', 'On-Site / Office', 'Retail Store', 'Café / Lounge'];
                                                // GROWTH
                                                case 'Target Audience': return ['B2B Enterprises', 'D2C Consumers', 'Gen-Z (18-24)', 'Millennials (25-34)', 'Local Businesses', 'Creators / Influencers', 'Parents & Families', 'High Net Worth (HNI)'];
                                                case 'Growth Objective': return ['User Acquisition', 'Brand Awareness', 'Revenue Growth', 'Retention & Loyalty', 'Lead Generation', 'App Installs', 'Website Traffic', 'Viral / Organic Reach'];
                                                case 'Current Metrics': return ['Pre-launch / Idea', '100+ Beta Users', '1k+ Active Users', '10k+ Monthly Traffic', '₹1M+ ARR', 'Seed Funded', 'Bootstrapped & Profitable', 'Pre-revenue MVP'];
                                                case 'Channels': return ['Instagram / TikTok', 'LinkedIn B2B', 'SEO / Organic Search', 'Paid Ads (Meta/Google)', 'Email Marketing', 'Cold Calling / Sales', 'PR / Media Outreach', 'Affiliate / Partnerships'];
                                                // FUNDING
                                                case 'Equity Offered': return ['1-5% (Advisory/Early)', '5-10% (Founding Member)', '10-20% (Co-founder)', '20-50% (Equal Partner)', 'Less than 1%', 'Open to Discuss', 'Stock Options (ESOPs)', 'Revenue Share Only'];
                                                case 'Fund Usage': return ['Product Development', 'Marketing & Sales', 'Hiring Key Roles', 'Working Capital', 'Scaling Infrastructure', 'Legal & Compliance', 'Inventory / Supply', 'R&D / Patents'];
                                                case 'Traction So Far': return ['Idea Stage', 'MVP Ready (Testing)', 'Early Paying Customers', 'Consistent Monthly Growth', 'Profitable & Scaling', 'Raised Friends & Family', 'Government Grants Won', 'B2B Pilots Secured'];
                                                case 'Pitch Deck Link': return ['Ready (Will share in DM)', 'Currently Building it', 'Available on Request', 'Draft version available', 'Not Needed / Informal', 'Looking for help to build', 'Financial Model Ready', 'Executive Summary Only'];
                                                // MENTORSHIP
                                                case 'Specific Problem': return ['Go-To-Market Strategy', 'Fundraising & Pitching', 'Technical Architecture', 'Career Growth / Pivot', 'Hiring & Culture', 'Sales & Conversion', 'Scaling Operations', 'Legal / Compliance Advice'];
                                                case 'Frequency': return ['One-time Call', 'Weekly Check-ins', 'Bi-weekly Syncs', 'Monthly Syncs', 'As needed / Casual', 'Quarterly Review', 'Paid Advisory Board', 'Text / Email Only'];
                                                case 'Ideal Mentor Profile': return ['Ex-Founder / Ex-CEO', 'Senior Executive (MNC)', 'Domain / Tech Expert', 'Angel Investor / VC', 'Marketing / Sales Leader', 'Product Manager', 'Academic / Researcher', 'Industry Veteran'];
                                                case 'Expectation': return ['Actionable Feedback', 'Network Introductions', 'Strategy & Code Review', 'Skill Building / Coaching', 'Mock Pitch Practice', 'Accountability Partner', 'Co-founder Matching', 'Brainstorming / Ideation'];
                                                // PARTNERSHIP
                                                case 'Equity Split': return ['50/50 Equal Split', 'Minority Stake (10-30%)', 'Majority Stake (51%+)', 'Vesting over 4 years', 'Performance based equity', 'Dynamic Slicing Pie', 'Open to Discuss', 'Fixed Profit Share'];
                                                case 'Commitment Level': return ['Full-time (40h+)', 'Part-time (20h)', 'Weekend Hacker', 'Advising (2-5h)', 'Project-based only', 'Flexible / Asynchronous', 'Capital Partner Only', 'Sweat Equity Partner'];
                                                case 'Shared Vision': return ['Build to Sell (Acquisition)', 'Lifestyle / Indie Business', 'Global Unicorn Scale', 'Social / Climate Impact', 'Local Market Dominance', 'Cashflow / Dividend focus', 'Open Source / Community', 'Franchise / Expansion'];
                                                case 'Complementary Skills': return ['I build, you sell', 'I sell, you build', 'Co-builders (Tech+Tech)', 'Operations + Product', 'Design + Engineering', 'Marketing + Finance', 'Content + Distribution', 'Hardware + Software'];
                                                // COLLABORATION
                                                case 'Deliverables': return ['1-2 Instagram Reels', '3+ TikToks / Shorts', 'YouTube Integration', 'UGC Photos & Video', 'Event Appearance', 'Podcast Guest Spot', 'Newsletter Feature', 'Dedicated Blog Post'];
                                                case 'Timeline': return ['ASAP / This Week', 'Within 14 Days', 'Within 1 Month', 'Next Quarter', 'Ongoing Monthly Campaign', 'One-off Launch Day', 'Seasonal / Festival', 'Flexible Timeline'];
                                                case 'Budget / Barter': return ['Paid Cash (Fixed)', 'Free Product (Barter)', 'Revenue Share / Affiliate', 'Paid + Free Product', 'Travel & Stay Covered', 'Mutual Shoutout', 'Equity / Long-term', 'Commission on Sales'];
                                                case 'Target Demographics': return ['Gen-Z (18-24)', 'Millennials (25-34)', 'Tech & Gadget Enthusiasts', 'Fashion & Beauty', 'Local Kochi / Kerala', 'Global English Speaking', 'Fitness & Wellness', 'Founders & Professionals'];
                                                // DEFAULT
                                                case 'What are you solving for?': 
                                                  if (content.toLowerCase().includes('model') || content.toLowerCase().includes('shoot') || content.toLowerCase().includes('actor') || content.toLowerCase().includes('creator')) {
                                                    return ["Brand Awareness", "Content Portfolio", "Product Launch Campaign", "Social Media Growth", "E-commerce Catalog", "Viral Reach", "Event Promotion", "Engagement Boost"];
                                                  }
                                                  return ["Product Market Fit", "Technical Scalability", "Operational Efficiency", "Market Expansion", "Customer Acquisition", "Process Automation", "Team Productivity", "Cost Optimization"];
                                                default: return ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Option 6"];
                                              }
                                            })()
                                          ) : (
                                            (content.toLowerCase().includes('model') || content.toLowerCase().includes('shoot') || content.toLowerCase().includes('actor') || content.toLowerCase().includes('creator')) ? [
                                              "Launch Fashion Brand", "Build Portfolio", "Find Brand Ambassadors", "Shoot Summer Campaign", "Grow Instagram"
                                            ] : [
                                              "Launch MVP (30 Days)", "Secure First 100 Users", "Hire Core Team", "Validate Model", "Optimize Strategy"
                                            ]
                                          ) ).map(option => (
                                            <button
                                              key={option}
                                              onClick={() => {
                                                const newContent = content.trim() + (content.includes('\n') ? '\n\n' : '\n') + s.replace('?', '') + ': ' + option;
                                                setContent(newContent);
                                                setActiveMenu(null);
                                                inputRef.current?.focus();
                                              }}
                                              className="w-full h-11 px-6 bg-slate-50 hover:bg-[#FF3B30] hover:text-white rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-bold text-slate-600 transition-all text-left uppercase tracking-tight"
                                            >
                                              {option}
                                            </button>
                                          ))}
                                          <div className="pt-3 mt-3 border-t border-black/[0.03]">
                                             <input 
                                               placeholder="Type custom..."
                                               onKeyDown={(e) => {
                                                 if (e.key === 'Enter') {
                                                   const val = (e.target as HTMLInputElement).value;
                                                   if (val) {
                                                     const newContent = content.trim() + (content.includes('\n') ? '\n\n' : '\n') + s.replace('?', '') + ': ' + val;
                                                     setContent(newContent);
                                                     setActiveMenu(null);
                                                     inputRef.current?.focus();
                                                   }
                                                 }
                                               }}
                                               className="w-full h-11 px-6 bg-white border border-black/[0.05] rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-bold outline-none focus:border-[#FF3B30] transition-all shadow-inner"
                                             />
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))}
                             </div>

                             {suggestedIndustry && (
                                <div className="pt-5 md:pt-6 border-t border-black/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                   <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 md:h-12 md:w-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-[#FF3B30] shadow-sm border border-black/[0.02] shrink-0"><Sparkles size={20} /></div>
                                      <div>
                                         <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-300 tracking-widest">Category Detected</p>
                                         <p className="text-[11px] md:text-[12px] font-black uppercase text-[#1A1A1A]">{getIndustryById(suggestedIndustry.industry)?.label}  {suggestedIndustry.focus}</p>
                                      </div>
                                   </div>
                                   <button 
                                     onClick={() => { setIndustry(suggestedIndustry.industry); setFocusAreas([suggestedIndustry.focus]); setSuggestedIndustry(null); }}
                                     className="h-12 md:h-14 px-6 md:px-8 bg-black text-white rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase hover:bg-[#FF3B30] transition-all shadow-xl active:scale-95"
                                   >Apply Category</button>
                                </div>
                             )}
                          </div>
                        </div>
                   </div>
                )}

                {/* STEP 2: CATEGORY */}
                {currentStep === 2 && (
                   <div className="space-y-6">
                      <h3 className="text-2xl md:text-3xl font-black tracking-tight">Pick a category</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {INDUSTRY_DATA.map(i => (
                           <button
                             key={i.id}
                             onClick={() => { setIndustry(i.id); setFocusAreas([]); }}
                             className={cn("h-14 rounded-2xl text-[10px] font-black uppercase transition-all border", industry === i.id ? "bg-black text-white border-black shadow-xl" : "bg-white text-slate-400 border-black/[0.05] hover:border-black/[0.15]")}
                           >{i.label}</button>
                        ))}
                      </div>
                      {industry && (
                        <div className="flex flex-wrap gap-2 pt-2">
                           {getIndustryById(industry)?.focusAreas.map(area => (
                             <button
                               key={area}
                               onClick={() => {
                                 if (focusAreas.includes(area)) setFocusAreas(prev => prev.filter(a => a !== area));
                                 else if (focusAreas.length < 3) setFocusAreas(prev => [...prev, area]);
                               }}
                               className={cn("px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all border", focusAreas.includes(area) ? "bg-black text-white border-black" : "bg-white text-slate-400 border-black/[0.05]")}
                             >{area}</button>
                           ))}
                        </div>
                      )}
                   </div>
                )}

                {/* --- MEETUP SPECIFIC --- */}
                {type === 'MEETUP' && (
                  <>
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">Choose Format</h3>
                        <div className="grid grid-cols-1 gap-3">
                          <button onClick={() => setMeetupSubtype('OPEN')} className={cn("p-6 rounded-[2rem] border text-left transition-all", meetupSubtype === 'OPEN' ? "border-[#E53935] bg-[#E53935]/5 shadow-lg" : "border-slate-100")}>
                            <div className="flex items-center gap-4">
                              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", meetupSubtype === 'OPEN' ? "bg-[#E53935] text-white" : "bg-slate-50 text-slate-400")}><Users size={24} /></div>
                              <div><p className="text-[14px] font-black uppercase text-[#1D1D1F]">Open Meetup</p><p className="text-[10px] font-bold text-slate-400 uppercase">Visible to everyone relevant</p></div>
                              {meetupSubtype === 'OPEN' && <CheckCircle2 className="ml-auto text-[#E53935]" size={20} />}
                            </div>
                          </button>
                          <button onClick={() => setMeetupSubtype('ADVISOR')} className={cn("p-6 rounded-[2rem] border text-left transition-all", meetupSubtype === 'ADVISOR' ? "border-[#E53935] bg-[#E53935]/5 shadow-lg" : "border-slate-100")}>
                            <div className="flex items-center gap-4">
                              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", meetupSubtype === 'ADVISOR' ? "bg-[#E53935] text-white" : "bg-slate-50 text-slate-400")}><ShieldCheck size={24} /></div>
                              <div><p className="text-[14px] font-black uppercase text-[#1D1D1F]">Advisor Meetup</p><p className="text-[10px] font-bold text-slate-400 uppercase">Requires advisor approval</p></div>
                              {meetupSubtype === 'ADVISOR' && <CheckCircle2 className="ml-auto text-[#E53935]" size={20} />}
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        {meetupSubtype === 'ADVISOR' ? (
                          <>
                            <h3 className="text-2xl font-black tracking-tight">Select Advisor</h3>
                            <div className="space-y-3">
                              {advisors.map(adv => (
                                <button key={adv.id} onClick={() => setSelectedAdvisor(adv)} className={cn("w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left", selectedAdvisor?.id === adv.id ? "border-[#E53935] bg-[#E53935]/5" : "border-slate-100")}>
                                  <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm"><img src={adv.avatar_url || DEFAULT_AVATAR} className="w-full h-full object-cover" /></div>
                                  <div className="flex-1"><p className="text-[12px] font-black uppercase text-[#1D1D1F]">{adv.full_name}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Expert Advisor</p></div>
                                  {selectedAdvisor?.id === adv.id && <CheckCircle2 className="text-[#E53935]" size={18} />}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="py-10 text-center space-y-4">
                            <div className="h-16 w-16 bg-slate-50 text-[#E53935] rounded-full flex items-center justify-center mx-auto"><Users size={32} /></div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Standard Meetup</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase max-w-[250px] mx-auto leading-relaxed">Directly host a session for anyone relevant in the network.</p>
                          </div>
                        )}
                      </div>
                    )}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">Where?</h3>
                        <div className="flex p-1 bg-slate-50 rounded-xl border border-black/[0.03]">
                           {['In-person', 'Online'].map(f => (
                             <button key={f} onClick={() => setMeetupFormat(f)} className={cn("flex-1 h-12 rounded-lg text-[10px] font-black uppercase transition-all", meetupFormat === f ? "bg-white text-black shadow-sm" : "text-slate-400")}>{f}</button>
                           ))}
                        </div>
                        {meetupFormat === 'In-person' ? (
                           <div className="space-y-4">
                              <div className="relative">
                                 <input 
                                   value={locationQuery} 
                                   onChange={(e) => setLocationQuery(e.target.value)} 
                                   placeholder="Search city, area or building..." 
                                   className="w-full h-14 pl-12 pr-6 bg-slate-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-black/5" 
                                 />
                                 <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                 
                                 {locationSuggestions.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                                       {locationSuggestions.map((s, idx) => (
                                          <button 
                                            key={idx}
                                            onClick={() => {
                                               const [lng, lat] = s.geometry.coordinates;
                                               const addr = s.properties.name + (s.properties.city ? `, ${s.properties.city}` : "") + (s.properties.state ? `, ${s.properties.state}` : "");
                                               setMeetupGeo({ lat, lng, address: addr });
                                               setLocationQuery("");
                                               setLocationSuggestions([]);
                                               if (mapRef.current) mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
                                            }}
                                            className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 text-left transition-all border-b border-slate-50 last:border-none"
                                          >
                                             <MapPin size={16} className="text-slate-300" />
                                             <div>
                                                <p className="text-[12px] font-bold text-slate-800">{s.properties.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{s.properties.city || s.properties.state || s.properties.country}</p>
                                             </div>
                                          </button>
                                       ))}
                                    </motion.div>
                                 )}
                              </div>

                              <div className="h-[200px] w-full rounded-2xl bg-slate-50 border relative overflow-hidden" ref={mapContainerRef}>
                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><MapPin size={32} className="text-[#E53935] -mt-8" /></div>
                                 <button 
                                   onClick={() => {
                                      navigator.geolocation.getCurrentPosition((pos) => {
                                         const { latitude, longitude } = pos.coords;
                                         setMeetupGeo(prev => ({ ...prev, lat: latitude, lng: longitude }));
                                         if (mapRef.current) mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
                                      });
                                   }}
                                   className="absolute bottom-4 right-4 h-10 w-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-black z-20"
                                 >
                                    <Navigation size={18} />
                                 </button>
                              </div>
                              <p className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-widest"> {meetupGeo.address || "Kochi, Kerala"}</p>
                           </div>
                        ) : (
                           <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                 {['Zoom', 'Google Meet', 'Teams', 'Other'].map(p => (
                                   <button key={p} onClick={() => setMeetupPlatform(p)} className={cn("h-16 rounded-xl border flex items-center justify-center gap-3", meetupPlatform === p ? "border-black bg-black text-white" : "border-slate-100 text-slate-400")}><Video size={16} /><span className="text-[10px] font-black uppercase">{p}</span></button>
                                 ))}
                              </div>
                              <input placeholder="Meeting link (optional)" className="w-full h-14 px-6 bg-slate-50 rounded-xl font-bold border-none" />
                           </div>
                        )}
                      </div>
                    )}
                    {currentStep === 6 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">Timing</h3>
                        <div className="space-y-4">
                           <input type="date" value={meetupDate} onChange={(e) => setMeetupDate(e.target.value)} className="w-full h-16 bg-slate-50 rounded-xl px-6 font-bold" />
                           <div className="grid grid-cols-2 gap-4">
                              <input type="time" value={meetupTime} onChange={(e) => setMeetupTime(e.target.value)} className="w-full h-16 bg-slate-50 rounded-xl px-6 font-bold" />
                              <select value={meetupDuration} onChange={(e) => setMeetupDuration(e.target.value)} className="w-full h-16 bg-slate-50 rounded-xl px-6 font-bold outline-none"><option>45 mins</option><option>1 hour</option><option>1.5 hours</option><option>2 hours</option></select>
                           </div>
                        </div>
                      </div>
                    )}
                    {currentStep === 7 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">Access & Cost</h3>
                        <div className="flex p-1 bg-slate-50 rounded-xl border border-black/[0.03]">
                           {['Free', 'Paid'].map(c => (
                             <button key={c} onClick={() => setMeetupPrice(c)} className={cn("flex-1 h-12 rounded-lg text-[10px] font-black uppercase transition-all", meetupPrice === c || (meetupPrice !== 'Free' && c === 'Paid') ? "bg-white text-black shadow-sm" : "text-slate-400")}>{c}</button>
                           ))}
                        </div>
                        {meetupPrice !== 'Free' && <input type="text" value={meetupPrice === 'Paid' ? "" : meetupPrice} onChange={(e) => setMeetupPrice(e.target.value)} placeholder="Amount" className="w-full h-16 bg-slate-50 rounded-xl px-6 font-black text-lg" />}
                        <div className="grid grid-cols-2 gap-3 pt-4">
                           <button onClick={() => setMeetupAccess('OPEN')} className={cn("h-20 rounded-2xl border flex flex-col items-center justify-center gap-1", meetupAccess === 'OPEN' ? "border-black bg-black text-white" : "border-slate-100 text-slate-400")}><Unlock size={18} /><span className="text-[9px] font-black uppercase">Anyone</span></button>
                           <button onClick={() => setMeetupAccess('CLOSED')} className={cn("h-20 rounded-2xl border flex flex-col items-center justify-center gap-1", meetupAccess === 'CLOSED' ? "border-black bg-black text-white" : "border-slate-100 text-slate-400")}><Lock size={18} /><span className="text-[9px] font-black uppercase">Approval</span></button>
                        </div>
                      </div>
                    )}
                    {currentStep === 8 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">Details</h3>
                        <div className="space-y-4">
                           <textarea value={meetupAgenda} onChange={(e) => setMeetupAgenda(e.target.value)} placeholder="What will happen?" className="w-full h-32 p-6 bg-slate-50 rounded-2xl font-medium text-sm" />
                           <textarea value={meetupTarget} onChange={(e) => setMeetupTarget(e.target.value)} placeholder="Who should join?" className="w-full h-32 p-6 bg-slate-50 rounded-2xl font-medium text-sm" />
                        </div>
                      </div>
                    )}
                    {currentStep === 9 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Review Session</h3>
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-black/[0.03] space-y-6">
                           <div className="flex items-center gap-4 border-b pb-4">
                              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm"><Users className="text-[#E53935]" size={24} /></div>
                              <div><p className="text-[10px] font-black uppercase text-slate-300">Topic</p><p className="text-[14px] font-black text-[#1D1D1F] line-clamp-1">{content.split('\n')[0]}</p></div>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div><p className="text-[9px] font-black uppercase text-slate-300">When</p><p className="text-[11px] font-black uppercase text-[#1D1D1F]">{new Date(meetupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}  {meetupTime}</p></div>
                              <div><p className="text-[9px] font-black uppercase text-slate-300">Where</p><p className="text-[11px] font-black uppercase text-[#1D1D1F] truncate">{meetupFormat === 'Online' ? meetupPlatform : meetupGeo.address}</p></div>
                              <div><p className="text-[9px] font-black uppercase text-slate-300">Cost</p><p className="text-[11px] font-black uppercase text-[#1D1D1F]">{meetupPrice}</p></div>
                              <div><p className="text-[9px] font-black uppercase text-slate-300">Seats</p><p className="text-[11px] font-black uppercase text-[#1D1D1F]">{meetupCapacity} Seats</p></div>
                           </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* --- REQUIREMENT SPECIFIC --- */}
                {type === 'REQUIREMENT' && (
                  <>
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Skills Needed</h3>
                        <div className="flex flex-wrap gap-2">
                           {focusAreas.map(f => (<div key={f} className="px-5 py-3 bg-slate-50 border rounded-xl text-[10px] font-black uppercase">{f}</div>))}
                        </div>
                      </div>
                    )}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Timeline</h3>
                        <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                           {['ASAP / Immediate', 'Within 7 Days', 'Within 30 Days', 'Long-term / Ongoing', 'Event Specific Date', 'Flexible / Discuss Later'].map(t => (
                             <button key={t} onClick={() => setTimeline(t)} className={cn("h-16 px-8 rounded-xl flex items-center justify-between border transition-all shrink-0", timeline === t ? "bg-black text-white" : "bg-white text-slate-400")}><span className="text-[12px] font-black uppercase tracking-widest">{t}</span>{timeline === t && <CheckCircle2 size={20} />}</button>
                           ))}
                        </div>
                      </div>
                    )}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Budget</h3>
                        <div className="flex p-1 bg-slate-50 rounded-xl border flex-wrap gap-1">
                           {['Fixed', 'Hourly', 'Open', 'Barter / Free', 'Rev-Share'].map(b => (
                             <button key={b} onClick={() => setBudgetType(b)} className={cn("flex-1 min-w-[80px] h-12 rounded-lg text-[10px] font-black uppercase transition-all", budgetType === b ? "bg-white text-black shadow-sm" : "text-slate-400")}>{b}</button>
                           ))}
                        </div>
                        {budgetType !== 'Open' && budgetType !== 'Barter / Free' && budgetType !== 'Rev-Share' && (
                           <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Amount (e.g. ₹10,000 or $500)" className="w-full h-16 bg-slate-50 rounded-xl px-6 font-black text-lg" />
                        )}
                      </div>
                    )}
                    {currentStep === 6 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Project Location</h3>
                        <div className="flex p-1 bg-slate-50 rounded-xl border border-black/[0.03] mb-4">
                           {['Remote / Online', 'Specific Location'].map(l => (
                             <button key={l} onClick={() => setLocation(l === 'Remote / Online' ? 'Remote' : '')} className={cn("flex-1 h-12 rounded-lg text-[10px] font-black uppercase transition-all", (l === 'Remote / Online' && location === 'Remote') || (l === 'Specific Location' && location !== 'Remote') ? "bg-white text-black shadow-sm" : "text-slate-400")}>{l}</button>
                           ))}
                        </div>
                        
                        {location !== 'Remote' && (
                          <div className="space-y-4">
                            <div className="relative">
                              <input 
                                value={location} 
                                onChange={(e) => setLocation(e.target.value)} 
                                placeholder="e.g. Kochi, Studio, or Hybrid..." 
                                className="w-full h-16 pl-12 pr-6 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-black/5" 

                              />
                              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">This anchors your requirement to the Discovery Map</p>
                          </div>
                        )}
                      </div>
                    )}
                    {currentStep === 7 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Review</h3>
                        <div className="p-6 bg-slate-50 rounded-[2rem] border space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                           <div className="border-b pb-4">
                             <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Requirement Details</p>
                             <p className="text-[13px] font-medium text-slate-800 whitespace-pre-wrap italic">"{content}"</p>
                           </div>
                           <div className="grid grid-cols-2 gap-4 pt-2">
                              <div><p className="text-[9px] font-black uppercase text-slate-400">Category</p><p className="text-[11px] font-black uppercase text-[#1D1D1F]">{getIndustryById(industry || '')?.label || 'General'}</p></div>
                              <div><p className="text-[9px] font-black uppercase text-slate-400">Skills</p><p className="text-[11px] font-black uppercase text-[#1D1D1F] truncate">{focusAreas.join(', ') || 'Any'}</p></div>
                              <div><p className="text-[9px] font-black uppercase text-slate-400">Timeline</p><p className="text-[11px] font-black uppercase text-[#1D1D1F]">{timeline}</p></div>
                              <div><p className="text-[9px] font-black uppercase text-slate-400">Budget</p><p className="text-[11px] font-black uppercase text-[#1D1D1F]">{budgetType === 'Open' || budgetType === 'Barter / Free' || budgetType === 'Rev-Share' ? budgetType : `${budgetType} - ${budget}`}</p></div>
                              <div><p className="text-[9px] font-black uppercase text-slate-400">Location</p><p className="text-[11px] font-black uppercase text-[#1D1D1F] truncate">{location}</p></div>
                           </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* --- PARTNERSHIP SPECIFIC --- */}
                {type === 'PARTNERSHIP' && (
                  <>
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Expertise</h3>
                        <div className="flex gap-2">
                           {EXPERIENCE_LEVELS.map(level => (
                             <button key={level} onClick={() => setExperienceLevel(level)} className={cn("flex-1 h-14 rounded-xl text-[10px] font-black uppercase transition-all border", experienceLevel === level ? "bg-black text-white" : "bg-white text-slate-400")}>{level}</button>
                           ))}
                        </div>
                      </div>
                    )}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Commitment</h3>
                        <div className="grid grid-cols-1 gap-3">
                           {['Casual', 'Active', 'Serious'].map(c => (
                             <button key={c} onClick={() => setCommitment(c)} className={cn("h-16 px-8 rounded-xl flex items-center justify-between border transition-all", commitment === c ? "bg-[#34C759] text-white" : "bg-white text-slate-400")}><span className="text-[12px] font-black uppercase tracking-widest">{c}</span>{commitment === c && <CheckCircle2 size={20} />}</button>
                           ))}
                        </div>
                      </div>
                    )}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Project Stage</h3>
                        <div className="grid grid-cols-1 gap-3">
                           {['Idea', 'MVP Built', 'Growth'].map(s => (
                             <button key={s} onClick={() => setStage(s)} className={cn("h-16 px-8 rounded-xl flex items-center justify-between border transition-all", stage === s ? "bg-[#34C759] text-white" : "bg-white text-slate-400")}><span className="text-[12px] font-black uppercase tracking-widest">{s}</span>{stage === s && <CheckCircle2 size={20} />}</button>
                           ))}
                        </div>
                      </div>
                    )}
                    {currentStep === 6 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Expectations</h3>
                        <div className="grid grid-cols-2 gap-3">
                           {['Part-time', 'Full-time'].map(w => (
                             <button key={w} onClick={() => setWorkType(w)} className={cn("h-16 rounded-xl flex items-center justify-center border transition-all", workType === w ? "bg-black text-white" : "bg-white text-slate-400")}><span className="text-[10px] font-black uppercase">{w}</span></button>
                           ))}
                        </div>
                        <input value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} placeholder="Weekly Hours (e.g. 10-15)" className="w-full h-16 bg-slate-50 rounded-xl px-6 font-bold" />
                      </div>
                    )}
                    {currentStep === 7 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Location</h3>
                        <div className="flex p-1 bg-slate-50 rounded-xl border border-black/[0.03] mb-4">
                           {['Remote', 'On-site'].map(l => (
                             <button key={l} onClick={() => setLocation(l === 'Remote' ? 'Remote' : '')} className={cn("flex-1 h-12 rounded-lg text-[10px] font-black uppercase transition-all", (l === 'Remote' && location === 'Remote') || (l === 'On-site' && location !== 'Remote') ? "bg-white text-black shadow-sm" : "text-slate-400")}>{l}</button>
                           ))}
                        </div>
                        
                        {location !== 'Remote' && (
                          <div className="space-y-4">
                            <div className="relative">
                              <input 
                                value={location} 
                                onChange={(e) => setLocation(e.target.value)} 
                                placeholder="Enter city or specific area..." 
                                className="w-full h-16 pl-12 pr-6 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-black/5" 
                              />
                              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {currentStep === 8 && (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Review</h3>
                        <div className="p-6 bg-slate-50 rounded-[2rem] border space-y-4">
                           <p className="text-sm font-bold text-slate-800 italic">"{content}"</p>
                           <div className="grid grid-cols-2 gap-4">
                              <div><p className="text-[9px] font-black uppercase text-slate-300">Stage</p><p className="text-[11px] font-black uppercase">{stage}</p></div>
                              <div><p className="text-[9px] font-black uppercase text-slate-300">Location</p><p className="text-[11px] font-black uppercase">{location}</p></div>
                           </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* NAVIGATION */}
                <div className="pt-4 flex flex-col gap-6">
                   {/* Step Indicator */}
                   <div className="flex items-center justify-center gap-2">
                      {Array.from({ length: config.steps }).map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "h-1.5 transition-all duration-300 rounded-full",
                            currentStep === i + 1 ? "w-8 bg-black" : "w-1.5 bg-slate-200"
                          )} 
                        />
                      ))}
                   </div>

                   {error && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                         <AlertCircle className="text-[#E53935]" size={16} /><p className="text-[10px] font-black uppercase text-[#E53935]">{error}</p>
                      </motion.div>
                   )}
                   <div className="flex gap-3">
                      {currentStep > 1 && (
                        <button onClick={() => setCurrentStep(prev => prev - 1)} className="h-16 px-6 bg-white border border-black/[0.05] text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all"><ChevronLeft size={24} /></button>
                      )}
                      {currentStep < config.steps ? (
                        <button onClick={() => {
                          console.log(`[POST_MODAL] Moving to Step ${currentStep + 1}`);
                          if (currentStep === 1 && !content.trim()) { setError("Tell us what this is about first"); return; }
                          setError(null); 
                          setCurrentStep(prev => prev + 1);
                        }} className={cn("flex-1 h-16 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3", config.color)}>Next<ArrowRight size={18} /></button>
                      ) : (
                        <button onClick={handlePost} disabled={submissionState !== null} className={cn("flex-1 h-16 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 group", config.color)}>{submissionState ? <Activity className="animate-spin" size={18} /> : <Zap size={18} />}{config.cta}</button>
                      )}
                   </div>
                </div>
             </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {submissionState && (
            <PostSubmissionStatus 
              state={submissionState} 
              onRetry={() => {
                setSubmissionState('RETRYING');
                setTimeout(handlePost, 1000);
              }}
              onCancel={() => {
                setSubmissionState(null);
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
