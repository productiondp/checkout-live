"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Plus, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  Target, 
  Users, 
  TrendingUp, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  X,
  Calendar,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import UniversalFeedCard from "@/components/ui/UniversalFeedCard";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { calculateMatchScore, getRelevanceLabel, IntentMode } from "@/utils/match-engine";
import { useUserSuccess } from "@/hooks/useUserSuccess";
import { SignalGuard } from "@/utils/signal-guard";
import { useNotifications } from "@/contexts/NotificationContext";

interface HomeFeedProps {
  posts: any[];
  isLoading: boolean;
  currentUserId?: string;
  onAction?: (post: any) => void;
  onEdit?: (post: any) => void;
  onDelete?: (post: any) => void;
  onCreate?: () => void;
}

export default function HomeFeed({ 
  posts, 
  isLoading, 
  currentUserId,
  onAction,
  onEdit,
  onDelete,
  onCreate
}: HomeFeedProps) {
  const router = useRouter();
  const { user } = useAuth();
  const insights = useUserSuccess(user?.id);
  const { unreadMessagesCount, pendingRequestsCount } = useNotifications();
  
  //  ACTION & CONTEXT TRACKING
  const [sessionActions, setSessionActions] = useState<string[]>([]);
  const [newlyCreatedPostId, setNewlyCreatedPostId] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [showPassiveMatch, setShowPassiveMatch] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: string} | null>(null);
  
  const actionCount = sessionActions.length;
  const myPosts = posts.filter(p => p.author_id === currentUserId);
  const hasPosted = sessionActions.includes('post_created') || myPosts.length > 0;
  const hasConnected = sessionActions.includes('connect_sent');

  const registerAction = (id: string) => {
    setSessionActions(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const [intentMode, setIntentMode] = useState<IntentMode>('SMART');
  const [sortMode, setSortMode] = useState<'NEARBY' | 'RELEVANT' | 'LATEST'>('NEARBY');
  const [selectedPost, setSelectedPost] = useState<any>(null);

  //  HELPER: HAVERSINE DISTANCE 
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  //  STEP 3: PASSIVE MATCH EXPANSION 
  useEffect(() => {
    if (hasPosted && !hasConnected) {
      const timer = setTimeout(() => setShowPassiveMatch(true), 15000); // 15s delay
      return () => clearTimeout(timer);
    }
  }, [hasPosted, hasConnected]);

    // Notification system is now driven by real context events.

  //  STEP 1: POST VISIBILITY LOCK 
  useEffect(() => {
    const lastPost = JSON.parse(localStorage.getItem('checkout_last_post') || '{}');
    if (lastPost.time && Date.now() - lastPost.time < 5000) {
      const match = posts.find(p => p.title === lastPost.title && p.author_id === currentUserId);
      if (match && newlyCreatedPostId !== match.id) {
        setNewlyCreatedPostId(match.id);
        registerAction('post_created');
        
        setTimeout(() => {
          const el = document.getElementById(`post-${match.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);

        // Snappy transition
        setTimeout(() => setNewlyCreatedPostId(null), 30000); // 30 seconds as requested
      }
    }
  }, [posts, currentUserId, newlyCreatedPostId]);

  // --- STEP 5: MATCH ENGINE & SCORING ---
  const processedPosts = React.useMemo(() => {
    if (!user) return posts;

    const userLat = user.location?.lat || 9.9312; // Fallback to Kochi
    const userLng = user.location?.lng || 76.2673;

    const userProfile = {
      id: user.id,
      role: user.role || 'PROFESSIONAL',
      industry: user.industry,
      intents: user.intents || [],
      skills: user.skills || [],
      location: user.location
    };

    const processed = posts.map((post, i) => {
      const { score, label: customLabel, tier, signals, actionScore, ctaHint, nudge, successProbability } = calculateMatchScore(userProfile, post, i, intentMode);
      
      const postLat = post.metadata?.geo?.lat;
      const postLng = post.metadata?.geo?.lng;
      const distance = calculateDistance(userLat, userLng, postLat, postLng);

      return {
        ...post,
        authorName: post.author?.full_name || post.authorName || "Member",
        relevanceScore: score,
        relevanceLabel: customLabel || null,
        relevanceSignals: signals,
        actionScore,
        ctaHint,
        nudge,
        tier,
        successProbability,
        distance
      };
    });

    //  V1.10 FEED GUARDRAILS 
    const guarded = SignalGuard.applyFeedGuardrails(processed, {
      maxTopOpportunities: 3,
      neutralRatio: 0.35
    });

    return guarded
      .filter((post: any) => {
        const authorId = post.author_id || post.author?.id;
        if (authorId === user.id) return true;
        
        // STRICT FILTERING FOR NON-SMART MODES
        if (intentMode !== 'SMART' && post.type !== intentMode) return false;
        
        // Removed the strict relevanceScore > 0 filter to ensure feed is populated
        // even if match parameters are not yet fully synced for a new user.
        return true;
      })
      .sort((a: any, b: any) => {
        if (sortMode === 'LATEST') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortMode === 'NEARBY') {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        }
        // DEFAULT: RELEVANT
        if (a.tier !== b.tier) return a.tier - b.tier;
        return (b.actionScore || 0) - (a.actionScore || 0);
      });
  }, [posts, user, intentMode, sortMode]);

  const dailyPriorities = processedPosts
    .filter(p => p.tier === 1 && p.actionScore > 0.6 && p.author_id !== currentUserId)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-white border border-slate-100 rounded-lg p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-50 rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-50 rounded" />
                <div className="h-3 w-20 bg-slate-50 rounded" />
              </div>
            </div>
            <div className="h-4 w-full bg-slate-50 rounded" />
            <div className="h-12 w-full bg-slate-50 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-[#292828] text-white rounded-full shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-xl"
          >
             <CheckCircle2 size={16} className="text-emerald-500" />
             <span className="text-[10px] font-black uppercase ">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
           {/* ACTION CARD 1: POST */}
            <motion.div 
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 group relative overflow-hidden bg-white border border-black/[0.05] rounded-[2.5rem] p-8 lg:p-12 shadow-2xl shadow-black/[0.03] cursor-pointer transition-all duration-500"
              onClick={() => onCreate?.()}
            >
               <div className="absolute top-0 right-0 w-48 h-48 bg-[#E53935]/5 rounded-full blur-[60px] group-hover:bg-[#E53935]/10 transition-all duration-700" />
               <div className="relative z-10 space-y-8">
                  <div className="h-16 w-16 bg-[#E53935] text-white rounded-[1.25rem] flex items-center justify-center shadow-[0_20px_40px_rgba(229,57,51,0.2)] group-hover:scale-110 transition-all duration-500 group-hover:rotate-3">
                     <Target size={32} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-3">
                     <h3 className="text-3xl lg:text-4xl font-black tracking-tight text-[#1D1D1F] leading-none">
                        {hasPosted ? "Update Requirement" : "Post Requirement"}
                     </h3>
                     <p className="text-[#86868B] text-[13px] font-bold tracking-wide leading-relaxed max-w-[260px]">
                        Share what you need and get matched with experts instantly.
                     </p>
                  </div>
                  <div className="flex items-center gap-3 text-[#E53935] text-[11px] font-black tracking-widest pt-6 border-t border-black/[0.03]">
                     <span>Broadcast Now</span>
                     <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
                  </div>
               </div>
            </motion.div>

           {/* ACTION CARD 2: FIND PARTNER (NEW DESIGN) */}
            <motion.div 
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 group relative overflow-hidden bg-[#1D1D1F] rounded-[2.5rem] p-8 lg:p-12 shadow-2xl shadow-black/20 cursor-pointer transition-all duration-500"
              onClick={() => { registerAction('see_people'); router.push('/matches'); }}
            >
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700" />
               <div className="relative z-10 space-y-8">
                  <div className="h-16 w-16 bg-white/5 border border-white/10 text-white rounded-[1.25rem] flex items-center justify-center shadow-2xl group-hover:bg-white group-hover:text-black transition-all duration-500 group-hover:-rotate-3">
                     <Users size={32} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-3">
                     <h3 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-none">
                        {hasConnected ? "Network Active" : "Find Partner"}
                     </h3>
                     <p className="text-white/40 text-[13px] font-bold tracking-wide leading-relaxed max-w-[260px]">
                        Explore the network and find the right partners to build with.
                     </p>
                  </div>
                  <div className="flex items-center gap-3 text-white text-[11px] font-black tracking-widest pt-6 border-t border-white/5">
                     <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        <span>{hasConnected ? "Explore Deeply" : "Start Discovery"}</span>
                     </div>
                     <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-3 transition-transform duration-500 ml-auto" />
                  </div>
               </div>
            </motion.div>
        </div>

        {/* STRATEGIC INSIGHTS STRIP */}
        <div className="flex flex-wrap items-center gap-4 px-2">
           {insights.map((insight, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-3 shadow-sm"
              >
                 <Sparkles size={12} className="text-emerald-600" />
                 <span className="text-[11px] font-bold text-emerald-700">{insight}</span>
              </motion.div>
           ))}
        </div>


            {/* SORT MODES */}
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-black/[0.03] ml-auto">
               {(['NEARBY', 'RELEVANT', 'LATEST'] as const).map((mode) => (
                  <button
                     key={mode}
                     onClick={() => setSortMode(mode)}
                     className={cn(
                        "px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                        sortMode === mode 
                           ? "bg-white text-black shadow-sm" 
                           : "text-slate-400 hover:text-slate-600"
                     )}
                  >
                     {mode.charAt(0) + mode.slice(1).toLowerCase()}
                  </button>
               ))}
            </div>

            {/*  STEP 4: DAILY PRIORITY LIST  */}
            {dailyPriorities.length > 0 && (
              <div className="bg-[#0A0A0A] rounded-[2.5rem] p-10 text-white relative overflow-hidden border border-white/5 shadow-2xl">
                 <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
                 <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <Zap size={20} className="text-white fill-white" />
                       </div>
                       <div>
                          <h2 className="text-xl font-black uppercase italic tracking-tight">Your Daily Priorities</h2>
                          <p className="text-xs text-white/40 font-bold uppercase tracking-widest">3 high-probability actions for today</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {dailyPriorities.map((post) => (
                          <div 
                            key={post.id}
                            onClick={() => {
                               const el = document.getElementById(`post-${post.id}`);
                               if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all cursor-pointer group"
                          >
                             <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-2">{post.nudge || "Strategic Match"}</p>
                             <h3 className="text-sm font-bold mb-4 line-clamp-1">{post.title}</h3>
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Act now</span>
                                <ArrowRight size={14} className="text-white/40 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}


         <div className="absolute bottom-8 right-12 flex items-center gap-3 opacity-60">
            <div className="h-1.5 w-16 bg-[#F5F5F7] rounded-full overflow-hidden">
               <div className="h-full bg-[#34C759] w-2/3" />
            </div>
            <span className="text-[10px] font-bold text-[#86868B]">Profile progress</span>
         </div>
      </motion.div>

      {/* --- STEP 3: PASSIVE MATCH EXPANSION SIGNAL --- */}
      <AnimatePresence>
        {showPassiveMatch && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between gap-6"
          >
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm">
                   <Sparkles size={24} />
                </div>
                <div className="space-y-0.5">
                   <h4 className="text-[11px] font-black uppercase text-emerald-700 ">More relevant profiles found</h4>
                   <p className="text-[9px] font-bold text-emerald-600/60 uppercase">System identified new matches for your post</p>
                </div>
             </div>
             <button 
               onClick={() => { router.push('/matches'); setShowPassiveMatch(false); }}
               className="h-12 px-8 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase  hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
             >
                View Matches
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STEP 3: INSTANT VALUE SIGNAL --- */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
         <div className="flex flex-wrap gap-3">
            <div className="px-5 py-2.5 bg-white border border-slate-100 rounded-full flex items-center gap-3 shadow-sm">
               <Target size={12} className="text-[#E53935]" />
               <span className="text-[10px] font-black uppercase  text-[#292828]/60">People matching your needs</span>
            </div>
            <div className="px-5 py-2.5 bg-white border border-slate-100 rounded-full flex items-center gap-3 shadow-sm">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase  text-[#292828]/60">Active now</span>
            </div>
         </div>
      </div>

       {posts.length === 0 ? (
         <div className="relative py-24 lg:py-32 flex flex-col items-center justify-center text-center px-6 overflow-hidden rounded-[2rem] bg-white border border-black/[0.03]">
            {/* Soft Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF3B30]/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 space-y-10 max-w-xl mx-auto">
               {/* Clean Icon */}
               <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 border border-slate-100 rounded-full" />
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="relative h-20 w-20 bg-[#1A1A1A] rounded-3xl flex items-center justify-center shadow-xl border border-white/5 group cursor-pointer"
                  >
                     <Zap size={32} className="text-[#FF3B30] fill-[#FF3B30]" />
                  </motion.div>
               </div>
               
               <div className="space-y-4">
                  <h3 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter text-[#1A1A1A] leading-tight">
                     Network <span className="text-[#FF3B30]">Is Live</span>
                  </h3>
                  
                  <p className="text-sm lg:text-base font-bold text-slate-400 uppercase leading-relaxed tracking-widest max-w-md mx-auto">
                     The platform is now open for members. As a founding member, your first post will help start the community's growth.
                  </p>
               </div>

               <button 
                 onClick={onCreate}
                 className="group relative h-16 px-10 bg-[#1A1A1A] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all duration-300 shadow-xl"
               >
                  <span className="flex items-center gap-3">
                     Create Your First Post <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
                  </span>
               </button>
            </div>
         </div>
       ) : (
        <AnimatePresence mode="popLayout">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="space-y-8"
          >
            {processedPosts.map((post) => {
              const isNew = newlyCreatedPostId === post.id;
              
              return (
                <div key={post.id} className="space-y-6">
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    id={`post-${post.id}`}
                    className={cn(
                      "transition-all duration-700",
                      isNew && "ring-8 ring-[#E53935]/5 rounded-lg bg-[#E53935]/5"
                    )}
                  >
                    <UniversalFeedCard 
                      post={post} 
                      currentUserId={currentUserId}
                      onAction={() => onAction?.(post)}
                      onDelete={() => onDelete?.(post)}
                      isNew={isNew}
                    />
                  </motion.div>

                  {isNew && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="relative px-[5%] mb-12"
                    >
                      <div className="bg-[#1D1D1F] rounded-[32px] p-10 lg:p-16 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] group/success border border-white/10 relative">
                        
                        {/* THE NEURAL SYNC BACKGROUND  ENHANCED */}
                        <div className="absolute inset-0 pointer-events-none">
                           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E53935]/15 rounded-full blur-[140px] -mr-64 -mt-64 animate-pulse" />
                           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#34C759]/10 rounded-full blur-[120px] -ml-48 -mb-48 opacity-50" />
                           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#34C759]/10 rounded-full blur-[120px] -ml-48 -mb-48 opacity-50" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col xl:flex-row gap-16 xl:items-center">
                           
                           {/* LEFT: STATUS HERO */}
                           <div className="flex-1 space-y-12">
                              <div className="space-y-8">
                                 <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#34C759]/10 border border-[#34C759]/20 rounded-full text-[#34C759] text-[11px] font-black uppercase tracking-[0.2em]">
                                    <div className="h-2 w-2 rounded-full bg-[#34C759] shadow-[0_0_15px_#34C759] animate-pulse" />
                                    Post Published & Live
                                 </div>
                                 <h1 className="text-6xl lg:text-8xl font-black text-white leading-[0.8] uppercase tracking-tighter italic">
                                    Requirement <br /> 
                                    <span className="text-[#E53935] drop-shadow-[0_0_30px_rgba(229,57,53,0.3)]">Published</span>
                                 </h1>
                                 <p className="text-white/50 font-bold text-xl lg:text-2xl max-w-lg leading-tight font-outfit">
                                    Your requirement is now visible to the network. We're matching you with relevant experts and partners.
                                 </p>
                              </div>

                              <div className="flex items-center gap-12 pt-10 border-t border-white/10">
                                 <div>
                                    <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.3em] mb-3">Sync Status</p>
                                    <div className="flex items-center gap-2">
                                       <div className="h-1.5 w-8 bg-[#34C759] rounded-full" />
                                       <p className="text-2xl font-black text-white uppercase tracking-tight font-outfit">Verified</p>
                                    </div>
                                 </div>
                                 <div className="h-14 w-[1px] bg-white/10" />
                                 <div>
                                    <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.3em] mb-3">Network Tier</p>
                                    <p className="text-2xl font-black text-[#E53935] uppercase tracking-tight italic font-outfit">Priority One</p>
                                 </div>
                              </div>
                           </div>

                           {/* RIGHT: INTELLIGENT MATCHES */}
                           <div className="w-full xl:w-[520px] space-y-8">
                              <div className="flex items-center justify-between">
                                 <h3 className="text-[11px] font-black uppercase text-white/30 tracking-[0.4em]">Smart Match Detection</h3>
                                 <div className="flex gap-1">
                                    <div className="h-1 w-4 bg-[#34C759] rounded-full" />
                                    <div className="h-1 w-1 bg-white/20 rounded-full" />
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 {[].map((profile: any, i) => (
                                   <motion.div 
                                     key={profile.name}
                                     initial={{ opacity: 0, x: 30 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     transition={{ delay: 0.5 + (i * 0.15) }}
                                     className="group/item flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-[24px] hover:bg-white/[0.08] transition-all hover:border-white/10 backdrop-blur-md"
                                   >
                                     <div 
                                       className="flex items-center gap-5 min-w-0 cursor-pointer"
                                       onClick={() => router.push(`/profile/${profile.id}`)}
                                     >
                                       <div className="h-16 w-16 rounded-[18px] bg-white/5 border border-white/10 overflow-hidden shrink-0 p-1.5 shadow-xl">
                                          <img src={profile.avatar} className="w-full h-full object-cover rounded-[12px] grayscale group-hover/item:grayscale-0 transition-all duration-500" alt="" />
                                       </div>
                                       <div className="min-w-0">
                                          <p className="text-[17px] font-black text-white uppercase truncate mb-0.5 font-outfit">{profile.name}</p>
                                          <div className="flex items-center gap-2">
                                             <div className="h-1 w-1 rounded-full bg-[#E53935] animate-pulse" />
                                             <p className="text-[11px] font-black text-[#E53935] uppercase tracking-widest">{profile.score}% Match Score</p>
                                          </div>
                                       </div>
                                     </div>
                                     <button 
                                       onClick={() => {
                                         setConnectedIds(prev => [...prev, profile.name]);
                                         registerAction('connect_sent');
                                       }}
                                       className={cn(
                                          "h-12 px-6 rounded-xl text-[11px] font-black uppercase transition-all shrink-0 border-2 font-outfit",
                                          connectedIds.includes(profile.name)
                                            ? "bg-[#34C759]/10 border-[#34C759]/20 text-[#34C759]"
                                            : "bg-white text-black border-white hover:bg-black hover:text-white hover:border-black"
                                       )}
                                     >
                                        {connectedIds.includes(profile.name) ? "Linked" : "Link Partner"}
                                     </button>
                                   </motion.div>
                                 ))}
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-6">
                                <button 
                                  onClick={() => router.push('/matches')}
                                  className="h-18 bg-white/5 border border-white/10 rounded-[24px] text-[11px] font-black uppercase text-white/50 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-4 group/btn"
                                >
                                  View Matches <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                                </button>
                                <button 
                                  onClick={() => {
                                    const post = posts.find(p => p.id === newlyCreatedPostId);
                                    const url = `${window.location.origin}/post/${newlyCreatedPostId}`;
                                    navigator.clipboard.writeText(`Check out my post on Checkout: ${url}`);
                                    alert("Link copied to clipboard!");
                                  }}
                                  className="h-18 bg-[#E53935]/10 border border-[#E53935]/20 rounded-[24px] text-[11px] font-black uppercase text-[#E53935] hover:bg-[#E53935]/20 transition-all flex items-center justify-center gap-4 group/share"
                                >
                                  Share Link <Sparkles size={18} className="group-hover/share:scale-125 transition-transform" />
                                </button>
                              </div>
                           </div>

                        </div>

                        {/* CLOSE TRIGGER */}
                        <button 
                          onClick={() => setNewlyCreatedPostId(null)}
                          className="absolute top-8 right-8 h-14 w-14 bg-white/5 text-white/20 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white transition-all border border-white/10 group-hover/success:text-white/50"
                        >
                          <X size={24} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
