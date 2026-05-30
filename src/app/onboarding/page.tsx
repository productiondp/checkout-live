"use client";
import React, { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { 
  ArrowRight, 
  CheckCircle2, 
  User, 
  Briefcase, 
  MapPin, 
  Camera, 
  ChevronLeft, 
  Loader2,
  ShieldCheck,
  Award,
  Laptop,
  Terminal,
  Activity,
  Plus,
  Compass,
  Zap,
  Globe,
  Rocket,
  Sparkles,
  PlayCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useAuthGuard } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AuthSubmissionStatus from "@/components/auth/AuthSubmissionStatus";

type Role = 'BUSINESS' | 'PROFESSIONAL' | 'ADVISOR' | 'STUDENT' | 'CREATOR';

type OnboardingState = {
  name: string;
  role: Role;
  jobRole: string;
  industry: string;
  intents: string[];
  bio: string;
  location: string;
  avatar_url: string;
};

import { detectIndustry, INDUSTRY_TO_FOCUS, ALL_INDUSTRIES, ROLE_TO_INDUSTRY, GLOBAL_TRENDING_FOCUS } from "@/utils/identity-engine";

import { detectBaseTag } from "@/utils/match-engine";

export default function OnboardingPage() {
  const { state, loading } = useAuthGuard('onboarding');
  
  if (loading || state.tag === 'initializing') {
    return <LoadingScreen />;
  }

  return <OnboardingContent />;
}

function OnboardingContent() {
  const { profile, session, updateProfile, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [customFocus, setCustomFocus] = useState("");
  const [libraryFocus, setLibraryFocus] = useState<any[]>([]);
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAllIndustries, setShowAllIndustries] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [onboardingData, setOnboardingData] = useState<OnboardingState>({
    name: "",
    role: "BUSINESS",
    jobRole: "",
    industry: "",
    intents: [],
    bio: "",
    location: "Trivandrum",
    avatar_url: ""
  });

  // Fetch Focus Library
  useEffect(() => {
    async function fetchLibrary() {
      try {
        const { data, error: libError } = await supabase
          .from('focus_library')
          .select('*')
          .order('usage_count', { ascending: false })
          .limit(10);
        
        // Graceful handle 404 (table missing) or 403 (forbidden)
        if (libError) {
          console.warn("[ONBOARDING] Focus library unavailable, using defaults.", libError.message);
          return;
        }
        if (data) setLibraryFocus(data);
      } catch (err) {
        console.warn("[ONBOARDING] Library fetch bypassed.");
      }
    }
    fetchLibrary();
  }, []);

  useEffect(() => {
    if (profile) {
      setOnboardingData(prev => ({
        ...prev,
        name: profile.full_name || prev.name,
        role: (profile.role as Role) || prev.role,
        jobRole: profile.jobRole || prev.jobRole,
        industry: profile.industry || prev.industry,
        intents: profile.intents || prev.intents,
        bio: profile.bio || prev.bio,
        location: profile.location || prev.location,
        avatar_url: profile.avatar_url || prev.avatar_url,
      }));
    }
  }, [profile]);


  const saveCustomFocus = async (label: string, industry: string) => {
    try {
      const cleanLabel = label.trim().toLowerCase();
      if (cleanLabel.length < 3 || !isNaN(Number(cleanLabel))) return;

      const { data: existing } = await supabase.from('focus_library').select('*').eq('label', cleanLabel).eq('industry', industry).maybeSingle();
      
      if (existing) {
        await supabase.from('focus_library').update({ usage_count: (existing.usage_count || 0) + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('focus_library').insert({ label: cleanLabel, industry, usage_count: 1 });
      }
    } catch (err) {
      console.warn("Could not save custom focus (table may be missing):", err);
    }
  };

  const saveProgress = async (isFinal = false) => {
    const userId = session?.user?.id;
    if (!userId) return;
    setIsSaving(true);
    setError(null);
    
    console.log("ONBOARDING: Starting save...", { isFinal, userId });
    try {
      console.log("ONBOARDING: Syncing focus library...");
      for (const intent of onboardingData.intents) {
        await saveCustomFocus(intent, onboardingData.industry);
      }
    } catch (e) {
      console.warn("Focus library sync failed, continuing...", e);
    }

    const detectedBaseTag = detectBaseTag(onboardingData.jobRole, onboardingData.intents);
    const finalIntents = onboardingData.intents.length > 0 ? onboardingData.intents : ["general"];

    const payload = {
      id: userId,
      full_name: onboardingData.name,
      role: onboardingData.role,
      industry: onboardingData.industry || "General",
      base_tag: detectedBaseTag,
      intent_tags: finalIntents,
      skills: finalIntents,
      bio: onboardingData.bio,
      location: onboardingData.location,
      avatar_url: onboardingData.avatar_url,
      onboarding_completed: isFinal
    };

    console.log("ONBOARDING: Upserting profile...", payload);
    try {
      //  SAFE-SAVE: Timeout after 5s to prevent permanent hang
      const savePromise = supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database timeout")), 5000)
      );

      const { error: saveError } = await Promise.race([savePromise, timeoutPromise]) as any;
      
      if (saveError) {
        console.error("ONBOARDING: Save Error caught:", saveError);
        // If it's a timeout or schema error, let them proceed locally if it's the final step
        if (isFinal) {
           console.warn("ONBOARDING: Proceeding with local fallback due to save error.");
           completeOnboardingLocally();
        } else {
           setError(saveError.message || "Connection slow. Please try again.");
        }
      } else {
        console.log("ONBOARDING: Save Success!");
        if (isFinal) {
          //  Deterministic: Update the independent onboarding_state tracker
          await supabase
            .from('onboarding_state')
            .upsert({
              user_id: userId,
              completed: true,
              step: 'completed',
              updated_at: new Date().toISOString()
            });

          completeOnboardingLocally();
        }
      }
    } catch (err: any) {
      console.error("ONBOARDING: Critical exception:", err);
      if (isFinal || err.message === "Database timeout") {
        console.warn("ONBOARDING: Triggering local fallback.");
        completeOnboardingLocally();
      } else {
        setError(err.message);
      }
    } finally {
      console.log("ONBOARDING: Save process finished.");
      setIsSaving(false);
    }
  };

  const completeOnboardingLocally = () => {
    const userId = session?.user?.id;
    if (!userId) return;

    if (typeof window !== 'undefined') {
      localStorage.setItem(`checkout_onboarded_${userId}`, 'true');
    }
    
    updateProfile({ 
      ...onboardingData, 
      full_name: onboardingData.name,
      onboarding_completed: true 
    });
    
    // REDIRECT NOTE: The useAuth state machine automatically detects 'onboarding_completed' 
    // and triggers the transition to /home. Manual routing is banned by Sentinel.
  };

  const nextStep = async () => {
    setError(null);
    
    if (step === 1) {
      if (!onboardingData.name.trim()) {
        setError("Please enter your name to continue.");
        return;
      }
      if (onboardingData.name.trim().length < 2) {
        setError("Name is too short.");
        return;
      }
    }
    
    if (step === 2) {
      if (!onboardingData.jobRole.trim() && !onboardingData.industry) {
        setError("Please type your job role or select an industry sector.");
        return;
      }
      if (!onboardingData.industry) {
        setError("Please select an industry sector.");
        return;
      }
      if (onboardingData.intents.length === 0) {
        setError("Select at least one area of focus.");
        return;
      }
    }

    if (step === 3) {
      if (onboardingData.bio.trim().length < 10) {
        setError("Please provide a slightly longer bio (min 10 chars).");
        return;
      }
    }

    await saveProgress();
    setStep(prev => prev + 1);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const userId = session?.user?.id;
    if (!file || !userId) return;

    // 1. Create and set instant preview
    const localPreviewUrl = URL.createObjectURL(file);
    setOnboardingData(prev => ({ ...prev, avatar_url: localPreviewUrl }));
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600'
        });
        
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 2. Set the permanent URL
      setOnboardingData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      // Revoke only after we have a valid state update queued
      setTimeout(() => URL.revokeObjectURL(localPreviewUrl), 1000);
    } catch (err: any) {
      console.error("AVATAR_UPLOAD_FAILED:", err);
      setError("Image upload failed. Please try again.");
      setOnboardingData(prev => ({ ...prev, avatar_url: user?.avatar_url || "" }));
    } finally {
      setIsUploading(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex items-center justify-center p-4 lg:p-8 font-sans selection:bg-[#FF3B30]/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-5xl bg-white rounded-lg border border-black/[0.05] shadow-[0_20px_60px_rgba(0,0,0,0.04)] overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-black/[0.03]">
             <div className="flex-1 p-10 lg:p-14 space-y-10">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5F5F7] border border-black/[0.05] rounded-full text-[#86868B] text-[10px] font-bold uppercase tracking-wider">
                      <CheckCircle2 size={12} className="text-[#34C759]" />
                      Setup Complete
                   </div>
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-[#1D1D1F] leading-[0.9] uppercase">
                       Core Network <br /> 
                       <span className="text-[#FF3B30]">Mission</span> <br />
                       Strategic Roadmap.
                    </h1>
                    <p className="text-[#86868B] font-medium text-lg lg:text-xl max-w-md leading-tight">
                       Your mission is initialized. Follow the roadmap to secure your first strategic partnership.
                    </p>
                </div>

                <div className="pt-10 border-t border-black/[0.03] grid grid-cols-1 sm:grid-cols-3 gap-6">
                   {[
                      { icon: Globe, label: "Global Scope", desc: "8K+ Partners", color: "text-[#E53935]", bg: "bg-[#E53935]/5" },
                      { icon: Zap, label: "Smart Match", desc: "Strategic Matching", color: "text-[#FF9500]", bg: "bg-[#FF9500]/5" },
                     { icon: Rocket, label: "Fast Track", desc: "Start in 60s", color: "text-[#34C759]", bg: "bg-[#34C759]/5" }
                   ].map((stat, i) => (
                     <div key={i} className="flex items-center gap-4">
                        <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center shrink-0", stat.bg)}>
                           <stat.icon size={20} className={stat.color} />
                        </div>
                        <div className="min-w-0">
                           <p className="text-[12px] font-bold text-[#1D1D1F] truncate">{stat.label}</p>
                           <p className="text-[10px] font-medium text-[#86868B] truncate uppercase tracking-tight">{stat.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="w-full lg:w-[380px] p-10 lg:p-14 bg-[#FAFAFB] flex flex-col justify-center gap-6">
                <button 
                  onClick={() => router.push("/?action=" + (onboardingData.role === 'ADVISOR' ? 'host_meetup' : 'post_need'))}
                  className="w-full h-20 bg-[#1D1D1F] text-white rounded-lg flex flex-col justify-center items-center gap-1 group transition-all active:scale-[0.98] shadow-2xl shadow-black/20 hover:bg-black"
                >
                   <div className="flex items-center gap-3">
                      {onboardingData.role === 'ADVISOR' ? <Sparkles size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                      <span className="text-base font-bold uppercase">
                         {onboardingData.role === 'ADVISOR' ? "Host a Meetup" : "Post a Need"}
                      </span>
                   </div>
                   <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                      {onboardingData.role === 'ADVISOR' ? "Share your expertise" : "Connect with the network"}
                   </span>
                </button>

                <button 
                  onClick={() => router.push("/")}
                  className="w-full h-16 bg-white border border-black/[0.08] rounded-lg flex items-center justify-center gap-3 transition-all hover:bg-[#F5F5F7] active:scale-95 group"
                >
                   <span className="text-sm font-bold uppercase tracking-tight text-[#1D1D1F]">
                      {onboardingData.role === 'ADVISOR' ? "Explore Needs" : "Find People"}
                   </span>
                   <ArrowRight size={18} className="text-[#86868B] group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-center text-[10px] font-bold text-[#86868B] uppercase tracking-widest pt-4">
                   Step into the network
                </p>
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#FF3B30]/10">
      <AnimatePresence>
        {isSaving && step === 3 && (
          <AuthSubmissionStatus 
            state="INITIALIZING" 
            onRetry={() => saveProgress(true)} 
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="relative w-full max-w-5xl bg-white lg:rounded-lg shadow-[0_40px_100px_rgba(0,0,0,0.05)] flex flex-col h-full lg:max-h-[85vh] overflow-hidden border-x border-slate-100">
        <div className="h-1.5 bg-slate-50 w-full flex p-0 relative z-50">
           <div 
             className="h-full bg-[#FF3B30] transition-all duration-1000 ease-out" 
             style={{ width: `${(step / 3) * 100}%` }}
           />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
           <header className="px-6 lg:px-20 pt-8 lg:pt-12 pb-6 lg:pb-8 flex items-start justify-between shrink-0 border-b border-slate-50 relative">
              <div className="space-y-4">
                 <div className="inline-flex items-center gap-2 text-[#FF3B30] text-[11px] font-black uppercase tracking-wider">
                    <div className="h-2 w-2 rounded-full bg-[#FF3B30] animate-pulse" />
                    Step {step} of 3 // {step === 1 ? "Identity" : step === 2 ? "Professional" : "Biography"}
                 </div>
                 <h1 className="text-3xl lg:text-7xl font-black uppercase text-[#1A1A1A] font-outfit tracking-tighter">
                    {step === 1 && "Who are you?"}
                    {step === 2 && (onboardingData.role === 'ADVISOR' ? "How can you help?" : "What do you do?")}
                    {step === 3 && "Almost done"}
                 </h1>
              </div>

              <button 
                onClick={() => {
                  console.log("[AUTH] Onboarding: Cancel clicked - Logging out");
                  logout();
                }}
                className="h-10 lg:h-12 px-4 lg:px-6 bg-slate-50 border border-slate-100 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 hover:text-[#1A1A1A] transition-all flex items-center gap-2 z-[99]"
              >
                <X size={14} /> <span className="hidden sm:inline">Cancel & Logout</span>
              </button>
           </header>

           <main className="flex-1 overflow-y-auto no-scrollbar px-6 lg:px-20 py-8 lg:py-10">
              <AnimatePresence mode="wait">
                 <motion.div
                   key={step}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="space-y-12 pb-24 lg:pb-12"
                 >
                    {step === 1 && (
                       <div className="space-y-10">
                           <div className="space-y-4">
                              <div className="flex flex-col gap-1">
                                 <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                    Your Name
                                    <div className="h-1 w-1 rounded-full bg-[#FF3B30]" />
                                 </label>
                                 <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight ml-1">How should we address you in the network?</p>
                              </div>
                             <div className="relative bg-slate-50 rounded-lg border border-slate-100 overflow-hidden focus-within:bg-white transition-all shadow-sm">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                                <input 
                                  type="text" 
                                  value={onboardingData.name}
                                  onChange={e => setOnboardingData(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Full Name"
                                  className="w-full h-16 lg:h-20 bg-transparent pl-16 pr-8 text-xl lg:text-2xl font-black text-[#1A1A1A] outline-none placeholder:text-slate-200"
                                />
                             </div>
                          </div>
                          
                          <div className="space-y-4">
                             <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Role</label>
                             <div className="grid grid-cols-2 lg:grid-[grid-template-columns:repeat(auto-fit,minmax(140px,1fr))] gap-4">
                                {[
                                  { id: 'BUSINESS', label: 'Company', icon: Briefcase },
                                  { id: 'PROFESSIONAL', label: 'Individual', icon: Laptop },
                                  { id: 'CREATOR', label: 'Creator', icon: PlayCircle },
                                  { id: 'ADVISOR', label: 'Advisor', icon: ShieldCheck },
                                  { id: 'STUDENT', label: 'Student', icon: Award }
                                ].map(r => (
                                  <button
                                    key={r.id}
                                    onClick={() => setOnboardingData(prev => ({ ...prev, role: r.id as Role }))}
                                    className={cn(
                                      "p-8 rounded-lg border transition-all text-left flex flex-col gap-4 relative h-40 justify-center group",
                                      onboardingData.role === r.id ? "bg-[#FF3B30]/5 border-[#FF3B30]/20 text-[#FF3B30]" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-slate-200"
                                    )}
                                  >
                                     <r.icon size={28} className={cn("transition-colors", onboardingData.role === r.id ? "text-[#FF3B30]" : "text-slate-300 group-hover:text-slate-400")} />
                                     <p className="text-[14px] font-black uppercase">{r.label}</p>
                                     {onboardingData.role === r.id && <div className="absolute top-0 right-0 h-1.5 w-full bg-[#FF3B30]" />}
                                  </button>
                                ))}
                             </div>
                          </div>
                        </div>
                     )}

                     {step === 2 && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                   <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                      {onboardingData.role === 'ADVISOR' ? "What can you help with?" : "What do you do?"}
                                      <div className="h-1 w-1 rounded-full bg-[#FF3B30]" />
                                   </label>
                                   <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight ml-1">
                                      {onboardingData.role === 'ADVISOR' ? "Define your primary area of expertise." : "Your primary role in the professional ecosystem."}
                                   </p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">I am a</span>
                                   <span className="text-[9px] font-black text-[#FF3B30] uppercase">
                                      {onboardingData.role === 'BUSINESS' && 'Company'}
                                      {onboardingData.role === 'PROFESSIONAL' && 'Individual'}
                                      {onboardingData.role === 'CREATOR' && 'Creator'}
                                      {onboardingData.role === 'ADVISOR' && 'Advisor'}
                                      {onboardingData.role === 'STUDENT' && 'Student'}
                                   </span>
                                </div>
                             </div>
                             <div className="relative flex items-center bg-slate-50 rounded-lg border border-slate-100 focus-within:bg-white transition-all shadow-sm px-6">
                                <div className="shrink-0">
                                   {onboardingData.role === 'ADVISOR' ? (
                                      <Sparkles className="text-[#E53935]" size={24} />
                                   ) : (
                                      <Laptop className="text-[#FF3B30]" size={24} />
                                   )}
                                </div>

                                 {onboardingData.industry && (
                                   <div className="flex items-center ml-4 shrink-0">
                                      <div className="h-8 px-4 rounded-full bg-[#1A1A1A] text-white text-[10px] font-black uppercase flex items-center gap-2 shadow-lg animate-in fade-in zoom-in-95 duration-300">
                                         {onboardingData.industry}
                                         <button 
                                           type="button"
                                           onClick={(e) => {
                                             e.preventDefault();
                                             e.stopPropagation();
                                             setOnboardingData(prev => ({ ...prev, industry: "" }));
                                          }}
                                          className="hover:text-[#FF3B30] transition-colors"
                                         >
                                           <X size={10} />
                                         </button>
                                      </div>
                                      <div className="w-[1px] h-6 bg-slate-200 mx-4" />
                                   </div>
                                 )}

                                 <input 
                                  type="text" 
                                  value={onboardingData.jobRole}
                                  onFocus={() => setShowSuggestions(true)}
                                  onBlur={() => {
                                    setTimeout(() => setShowSuggestions(false), 200);
                                  }}
                                  onChange={e => {
                                    const val = e.target.value;
                                    const detection = detectIndustry(val);
                                    const highConfidence = detection.confidence > 0.6;
                                    
                                    if (val.length >= 2) {
                                      const filtered = Object.keys(ROLE_TO_INDUSTRY).filter(r => 
                                        r.toLowerCase().includes(val.toLowerCase())
                                      );
                                      setRoleSuggestions(filtered);
                                      setShowSuggestions(true);
                                    } else {
                                      setRoleSuggestions([]);
                                    }

                                    setOnboardingData(prev => ({ 
                                      ...prev, 
                                      jobRole: val,
                                      industry: (highConfidence && detection.industries.length === 1) ? detection.industries[0] : prev.industry 
                                    }));
                                  }}
                                  placeholder={onboardingData.role === 'ADVISOR' ? "e.g. Startup Strategy, Marketing Guidance" : onboardingData.role === 'CREATOR' ? "e.g. Content Creator, YouTuber, Model" : "e.g. Video Editor, Founder, Developer"}
                                  className="flex-1 h-16 lg:h-20 bg-transparent pr-8 text-xl lg:text-2xl font-black text-[#1A1A1A] outline-none placeholder:text-slate-200"
                                />

                                {/* Auto-suggestion Dropdown - kept absolute to the relative parent */}
                                <AnimatePresence>
                                  {showSuggestions && roleSuggestions.length > 0 && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                      className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200/60 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] rounded-2xl z-[100] overflow-hidden backdrop-blur-xl"
                                    >
                                      <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                         <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">Matching Roles</span>
                                         <div className="h-1.5 w-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
                                      </div>
                                      <div className="max-h-[320px] overflow-y-auto no-scrollbar py-2">
                                        {roleSuggestions.map(s => (
                                          <button 
                                            key={s}
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const detection = detectIndustry(s);
                                              setOnboardingData(prev => ({ 
                                                ...prev, 
                                                jobRole: s.charAt(0).toUpperCase() + s.slice(1),
                                                industry: detection.industries[0] || prev.industry
                                              }));
                                              setRoleSuggestions([]);
                                              setShowSuggestions(false);
                                            }}
                                            className="w-full px-6 py-4 text-left hover:bg-slate-50 flex items-center justify-between group transition-all"
                                          >
                                            <div className="flex items-center gap-4">
                                               <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-[#FF3B30] group-hover:border-[#FF3B30]/20 transition-all">
                                                  <Compass size={18} />
                                               </div>
                                               <div className="flex flex-col">
                                                  <span className="text-[13px] font-black uppercase text-[#1A1A1A] tracking-tight group-hover:translate-x-1 transition-transform">{s}</span>
                                                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Industry: {detectIndustry(s).industries[0] || "General"}</span>
                                               </div>
                                            </div>
                                            <ArrowRight size={14} className="text-slate-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                          </button>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                             </div>
                             
                             <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 px-1">
                                    <div className="flex items-center gap-2">
                                       <div className="h-1 w-1 rounded-full bg-[#FF3B30] animate-pulse" />
                                       <span className="text-[10px] font-black uppercase text-[#FF3B30] tracking-widest">
                                         Industry Sector
                                       </span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight ml-1">Required: Select the category that best fits your role.</p>
                                   <div className="flex flex-wrap gap-2">
                                      {(detectIndustry(onboardingData.jobRole).industries.length > 0 
                                        ? Array.from(new Set([...detectIndustry(onboardingData.jobRole).industries, onboardingData.industry].filter(Boolean)))
                                        : ALL_INDUSTRIES
                                      ).slice(0, showAllIndustries ? undefined : 6).map(ind => (
                                        <button 
                                          key={ind}
                                          onClick={() => setOnboardingData(prev => ({ ...prev, industry: ind }))}
                                          className={cn(
                                            "h-9 px-5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 transition-all border",
                                            onboardingData.industry === ind 
                                              ? "bg-[#1A1A1A] text-white border-black shadow-lg shadow-black/10 scale-105" 
                                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                                          )}
                                        >
                                           {ind}
                                           {onboardingData.industry === ind && <CheckCircle2 size={10} />}
                                        </button>
                                      ))}
                                      
                                      {!showAllIndustries && (ALL_INDUSTRIES.length > 6) && (
                                        <button 
                                          onClick={() => setShowAllIndustries(true)}
                                          className="h-9 px-5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 transition-all border border-dashed border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600"
                                        >
                                          + View All
                                        </button>
                                      )}
                                   </div>
                                 </motion.div>
                          </div>

                           <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                 <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                       Suggested for you
                                       <div className="h-1 w-1 rounded-full bg-[#FF3B30]" />
                                    </label>
                                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight ml-1">Select up to 3 focus areas to optimize your discovery.</p>
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-300 uppercase">{onboardingData.intents.length}/3</span>
                              </div>

                             <div className="flex flex-wrap gap-2.5">
                                 {/* Selected Tags First */}
                                 {onboardingData.intents.map(intent => (
                                   <button 
                                     key={intent}
                                     onClick={() => { 
                                       setOnboardingData(prev => ({ ...prev, intents: prev.intents.filter(x => x !== intent) }));
                                     }} 
                                     className="h-11 px-6 rounded-lg bg-[#FF3B30] text-white border border-[#FF3B30] shadow-lg shadow-[#FF3B30]/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-2"
                                   >
                                      {intent}
                                      <X size={12} />
                                   </button>
                                 ))}

                                 {/* Suggested Tags (Filtered by Industry + Trending Fallback) */}
                                 {[
                                   ...(INDUSTRY_TO_FOCUS[onboardingData.industry] || []),
                                   ...GLOBAL_TRENDING_FOCUS,
                                   ...(libraryFocus.filter(f => f.industry === onboardingData.industry && f.usage_count >= 2).map(f => f.label))
                                 ].filter(intent => !onboardingData.intents.includes(intent))
                                  .filter((v, i, a) => a.indexOf(v) === i) // Unique
                                  .slice(0, showAllTags ? undefined : 12).map(intent => {
                                   return (
                                     <button 
                                       key={intent}
                                       onClick={() => { 
                                         if (onboardingData.intents.length < 3) {
                                           setOnboardingData(prev => ({ ...prev, intents: [...prev.intents, intent] }));
                                         }
                                       }} 
                                       className="h-11 px-6 rounded-lg border border-slate-100 bg-white text-slate-400 hover:border-slate-300 transition-all text-[11px] font-black uppercase tracking-wider"
                                     >
                                        {intent}
                                     </button>
                                   );
                                 })}

                                 {!showAllTags && (
                                   <button 
                                     onClick={() => setShowAllTags(true)}
                                     className="h-11 px-6 rounded-lg border border-dashed border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600 text-[11px] font-black uppercase tracking-wider"
                                   >
                                     + View All
                                   </button>
                                 )}

                                 <div className="relative">
                                    <input 
                                      type="text"
                                      value={customFocus}
                                      onChange={e => setCustomFocus(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter' && customFocus.trim()) {
                                          e.preventDefault();
                                          const val = customFocus.trim().toLowerCase();
                                          if (!onboardingData.intents.includes(val) && onboardingData.intents.length < 3) {
                                             setOnboardingData(prev => ({ ...prev, intents: [...prev.intents, val] }));
                                          }
                                          setCustomFocus("");
                                        }
                                      }}
                                      placeholder="+ Add your own"
                                      className="h-11 px-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-[11px] font-black uppercase outline-none focus:bg-white focus:border-[#FF3B30]/30 transition-all w-44"
                                    />
                                 </div>
                              </div>
                          </div>

                        </div>
                     )}

                    {step === 3 && (
                       <div className="space-y-12">
                           <div className="space-y-4">
                              <div className="flex flex-col gap-1">
                                 <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                    About you
                                    <div className="h-1 w-1 rounded-full bg-[#FF3B30]" />
                                 </label>
                                 <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight ml-1">A brief introduction for your public profile.</p>
                              </div>
                             <textarea 
                               value={onboardingData.bio}
                               onChange={e => setOnboardingData(prev => ({ ...prev, bio: e.target.value }))}
                               placeholder="Short description of your background..."
                               className="w-full h-24 bg-slate-50 border border-slate-100 rounded-lg p-6 text-lg font-bold text-[#1A1A1A] outline-none placeholder:text-slate-200 focus:bg-white transition-all resize-none shadow-sm"
                             />
                          </div>

                          <div className="flex justify-center">
                             <div className="relative group">
                                <div className="h-44 w-44 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 relative shadow-xl">
                                   <img src={onboardingData.avatar_url || `https://ui-avatars.com/api/?name=${onboardingData.name}&background=f1f5f9&color=64748b&bold=true`} className="w-full h-full object-cover" alt="Profile preview" />
                                   {isUploading && (
                                     <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                                       <Loader2 className="animate-spin text-white" size={28} />
                                       <span className="text-[9px] font-black text-white uppercase tracking-widest">Uploading...</span>
                                     </div>
                                   )}
                                </div>
                                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="absolute -bottom-3 -right-3 h-14 w-14 bg-[#FF3B30] text-white rounded-lg flex items-center justify-center shadow-xl border-4 border-white z-20 hover:scale-110 transition-transform disabled:opacity-70 disabled:hover:scale-100">
                                  {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                             </div>
                          </div>

                           <div className="space-y-4">
                              <div className="flex flex-col gap-1">
                                 <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                    Location
                                    <div className="h-1 w-1 rounded-full bg-[#FF3B30]" />
                                 </label>
                                 <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight ml-1">Where are you based for local opportunities?</p>
                              </div>
                             <div className="relative bg-slate-50 rounded-lg border border-slate-100 overflow-hidden focus-within:bg-white transition-all shadow-sm">
                                <MapPin size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#FF3B30]" />
                                <input type="text" value={onboardingData.location} onChange={e => setOnboardingData(prev => ({ ...prev, location: e.target.value }))} className="w-full h-16 lg:h-20 bg-transparent pl-16 pr-8 text-xl lg:text-2xl font-black text-[#1A1A1A] outline-none uppercase" />
                             </div>
                          </div>

                          <div className="bg-emerald-50 rounded-lg p-8 flex items-center gap-6 border border-emerald-100">
                             <div className="h-14 w-14 bg-white rounded-lg flex items-center justify-center text-emerald-500 shrink-0 shadow-lg shadow-emerald-500/10"><CheckCircle2 size={32} /></div>
                             <div>
                                <p className="text-[16px] font-black text-emerald-800 uppercase tracking-wider mb-0.5">All set</p>
                                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-tight">Your profile is ready to go.</p>
                             </div>
                          </div>
                        </div>
                     )}

                     {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-[11px] font-black uppercase tracking-wider"
                        >
                           <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                           {error}
                        </motion.div>
                     )}
                  </motion.div>
              </AnimatePresence>
           </main>

           <footer className="px-6 lg:px-20 py-6 lg:py-8 bg-white border-t border-slate-100 flex items-center gap-4 lg:gap-6 shrink-0">
              {step > 1 && <button onClick={() => setStep(step - 1)} className="h-16 w-16 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#1A1A1A] transition-all border border-slate-100"><ChevronLeft size={24} /></button>}
              <button 
                onClick={step === 3 ? () => saveProgress(true) : nextStep} 
                disabled={isSaving || isUploading} 
                className="flex-1 h-16 bg-[#1A1A1A] hover:bg-black text-white rounded-lg text-[15px] font-black uppercase flex items-center justify-center gap-4 shadow-xl active:scale-95 disabled:opacity-50 transition-all tracking-widest"
              >
                 {isSaving ? (
                   <div className="flex items-center gap-3">
                     <Loader2 className="animate-spin" size={24} />
                     <span>{step === 3 ? "Setting things up..." : "Saving..."}</span>
                   </div>
                 ) : (
                   <>
                     <span>{step === 3 ? "Finish" : "Continue"}</span>
                     <ArrowRight size={24} />
                   </>
                 )}
              </button>
           </footer>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
       <div className="relative">
          <div className="h-20 w-20 border-4 border-slate-50 border-t-[#FF3B30] rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="h-10 w-10 bg-[#FF3B30] rounded-lg animate-pulse" />
          </div>
       </div>
       <div className="space-y-2 text-center">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]">Initializing</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Secure Environment</p>
       </div>
    </div>
  );
}
