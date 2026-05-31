"use client";
import React, { useState, useMemo } from "react";
import { 
  MapPin, 
  Users, 
  Calendar, 
  Plus, 
  Clock, 
  LayoutGrid, 
  List,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Zap,
  Target,
  BrainCircuit,
  Maximize2,
  Filter,
  Check,
  ChevronRight,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { calculateMatchScore } from "@/lib/ai";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AnimatePresence, motion } from "framer-motion";
import TerminalLayout from "@/components/layout/TerminalLayout";

const TOPICS = ["All", "Networking", "Investment", "Community", "Strategy", "Tech", "Logistics"];

const MeetupCard = ({ meetup, isJoined, onJoin, viewMode }: { meetup: any; isJoined: boolean; onJoin: () => void; viewMode: string }) => {
  return (
    <div className="group relative">
      <div className={cn(
          "bg-white rounded-2xl border border-[#292828]/10 overflow-hidden transition-all duration-500 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] hover:border-[#E53935]/20 hover:-translate-y-2",
          isJoined && "border-emerald-500/30 ring-4 ring-emerald-500/5 shadow-2xl shadow-emerald-500/10"
      )}>
          {/* AI Alignment Indicator */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
            <div className="px-3 py-1.5 md:px-4 md:py-2 bg-white/90 backdrop-blur-md rounded-lg border border-[#292828]/10 flex items-center gap-2 shadow-lg">
                <Sparkles size={12} className="text-[#E53935] animate-pulse" />
                <span className="text-[9px] md:text-[10px] font-black text-[#292828] uppercase">{meetup.matchPotential}% Score</span>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl overflow-hidden border border-[#292828]/10 shadow-sm relative group-hover:rotate-3 transition-transform">
                  <img src={meetup.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                  <div className="absolute inset-0 bg-[#E53935]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <Link href={`/advisor/${meetup.author_id}`} className="hover:opacity-80 transition-opacity min-w-0">
                  <h4 className="text-[13px] md:text-[14px] font-black text-[#E53935] uppercase leading-none mb-1.5 truncate">{meetup.authorName}</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[9px] md:text-[10px] font-bold text-[#292828]/30 uppercase whitespace-nowrap">{meetup.category}  {meetup.timeAgo}</p>
                    <div className="hidden sm:block h-1 w-1 bg-black/10 rounded-full" />
                    <div className="flex items-center gap-1">
                      <Target size={10} className="text-emerald-500" />
                      <span className="text-[9px] font-bold text-emerald-600 uppercase">{meetup.trustScore}% Trust</span>
                    </div>
                  </div>
                </Link>
            </div>

            <div className="space-y-3">
                <h3 className="text-lg md:text-xl font-black uppercase group-hover:text-[#E53935] transition-colors line-clamp-2">{meetup.title}</h3>
                <p className="text-[13px] md:text-[14px] font-medium text-[#292828]/60 leading-relaxed italic line-clamp-2">"{meetup.content}"</p>
            </div>

            <div className="flex flex-col gap-3">
                <div 
                  onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetup.location || "Trivandrum")}`, '_blank'); }}
                  className="flex items-center gap-4 p-4 bg-[#292828]/5 rounded-xl border border-[#292828]/5 group-hover:bg-white group-hover:border-[#292828]/10 transition-all cursor-pointer"
                >
                  <div className="h-9 w-9 md:h-10 md:w-10 bg-[#292828] rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg group-hover:bg-[#E53935]">
                      <MapPin size={16} />
                  </div>
                  <div className="min-w-0">
                      <p className="text-[8px] font-bold text-[#292828]/30 uppercase leading-none mb-1.5">Venue</p>
                      <p className="text-[11px] md:text-[12px] font-bold text-[#292828] uppercase truncate">{meetup.location || "Online"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-[#292828]/5 rounded-xl border border-[#292828]/5 group-hover:bg-white group-hover:border-[#292828]/10 transition-all">
                  <div className="h-9 w-9 md:h-10 md:w-10 bg-[#E53935]/10 rounded-lg flex items-center justify-center text-[#E53935] shrink-0 border border-[#E53935]/20">
                      <Clock size={16} />
                  </div>
                  <div className="min-w-0">
                      <p className="text-[8px] font-bold text-[#E53935] uppercase leading-none mb-1.5">Time</p>
                      <p className="text-[11px] md:text-[12px] font-bold text-[#292828] uppercase truncate">{meetup.dateTime || "TODAY, 18:30"}</p>
                  </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 pt-6 md:pt-8 border-t border-[#292828]/5 mt-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                          <img src={`https://i.pravatar.cc/150?u=${meetup.id + i}`} alt="" className="grayscale" />
                        </div>
                      ))}
                  </div>
                  <span className="text-[10px] md:text-[11px] font-bold text-[#292828]/40 uppercase ">{meetup.attendees}/{meetup.maxAttendees} Occupied</span>
                </div>

                <button 
                  onClick={onJoin}
                  disabled={!isJoined && meetup.attendees >= meetup.maxAttendees}
                  className={cn(
                    "h-12 md:h-14 px-6 md:px-8 rounded-xl font-black text-[10px] md:text-[11px] uppercase transition-all duration-500 shadow-xl flex items-center justify-center gap-3 active:scale-95",
                    isJoined 
                    ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                    : meetup.attendees >= meetup.maxAttendees ? "bg-black/10 text-black/20 cursor-not-allowed" : "bg-[#292828] text-white hover:bg-[#E53935] shadow-black/10"
                  )}
                >
                  {isJoined ? (
                    <><CheckCircle2 size={16} strokeWidth={3} /> You're In</>
                  ) : meetup.attendees >= meetup.maxAttendees ? (
                    "Full"
                  ) : (
                    <><Plus size={16} strokeWidth={3} /> Join Meetup</>
                  )}
                </button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default function MeetupPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [meetups, setMeetups] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAiArchitect, setShowAiArchitect] = useState(false);
  const [hostStep, setHostStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState("All");
  const [showHostModal, setShowHostModal] = useState(false);
  
  // NEW SYSTEM STATE
  const [meetupType, setMeetupType] = useState<"Open" | "Advisor">("Open");
  const [selectedAdvisor, setSelectedAdvisor] = useState<any | null>(null);
  const [suggestedAdvisors, setSuggestedAdvisors] = useState<any[]>([]);

  const [sortMode, setSortMode] = useState<"NEARBY" | "RELEVANT" | "UPCOMING">("RELEVANT");
  const [userParticipants, setUserParticipants] = useState<string[]>([]);

  const supabase = createClient();

  const initMeetup = async () => {
    if (!authUser) return;
    setIsLoading(true);

    try {
      // 1. Fetch Meetups
      const { data: meetupData, error: meetupError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, full_name, avatar_url, match_score)
        `)
        .eq('type', 'MEETUP')
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (meetupError) throw meetupError;

      // 2. Fetch User Joins
      const { data: participantData } = await supabase
        .from('meetup_participants')
        .select('meetup_id')
        .eq('user_id', authUser.id);
      
      setUserParticipants(participantData?.map(p => p.meetup_id) || []);

      // 3. Map Data
      const mapped = (meetupData || []).map(m => {
        const isAdvisorMeetup = m.metadata?.is_advisor_led || false;
        const advisorAccepted = m.metadata?.advisor_accepted !== false; // Default to true if not explicitly false
        const visibility = m.metadata?.visibility || 'open';
        const invitedUsers = m.metadata?.invited_users || [];
        
        // Visibility Logic
        let isVisible = true;
        if (isAdvisorMeetup && !advisorAccepted) isVisible = false;
        if (visibility === 'closed' && !invitedUsers.includes(authUser.id) && m.author_id !== authUser.id) isVisible = false;

        return {
          ...m,
          isVisible,
          authorName: m.author?.full_name || "Community Member",
          avatar: m.author?.avatar_url || `https://i.pravatar.cc/150?u=${m.id}`,
          timeAgo: m.dateTime || "Upcoming",
          matchPotential: m.match_score || 0,
          attendees: m.participant_count || 0,
          maxAttendees: m.max_slots || 8,
          category: m.domain || "Networking",
          isPremium: isAdvisorMeetup,
          advisor: m.author, // Assuming author is advisor for advisor-led
          trustScore: m.author?.match_score || 85
        };
      }).filter(m => m.isVisible);

      setMeetups(mapped);
    } catch (err) {
      console.error("Meetup Load Error:", err);
      // Fallback: show empty list but ensure loading finishes
      setMeetups([]); 
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    initMeetup();
  }, [authUser]);

  const filteredMeetups = useMemo(() => {
    let list = meetups.filter(m => activeTopic === "All" || m.category === activeTopic);
    
    // Sort logic
    if (sortMode === "NEARBY") {
      // Proximity sorting (simulated for now, would use lat/lng in production)
      list = [...list].sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (sortMode === "RELEVANT") {
      list = [...list].sort((a, b) => b.matchPotential - a.matchPotential);
    } else if (sortMode === "UPCOMING") {
      list = [...list].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }

    return list;
  }, [meetups, activeTopic, sortMode]);

  const topMeetups = useMemo(() => {
    return filteredMeetups
      .filter(m => m.isPremium || m.matchPotential > 90)
      .slice(0, 2);
  }, [filteredMeetups]);

  const allMeetups = useMemo(() => {
    return filteredMeetups.slice(topMeetups.length);
  }, [filteredMeetups, topMeetups]);

  const handleJoin = async (id: string) => {
    if (!authUser) {
      router.push('/');
      return;
    }
    
    const isJoined = userParticipants.includes(id);
    
    if (isJoined) {
      // If already joined, just navigate to the chat room
      const { data: meetup } = await supabase.from('posts').select('room_id').eq('id', id).single();
      if (meetup?.room_id) {
        router.push(`/chat?room=${meetup.room_id}`);
      } else {
        alert("Preparing group chat. Check back in a moment.");
      }
    } else {
      // Join using the service to handle room syncing
      try {
        const { MeetupService } = await import("@/services/meetup-service");
        const { roomId } = await MeetupService.joinMeetup(id, authUser.id);
        
        setUserParticipants(prev => [...prev, id]);
        setMeetups(prev => prev.map(m => m.id === id ? { ...m, attendees: m.attendees + 1 } : m));
        
        if (roomId) {
          router.push(`/chat?room=${roomId}`);
        }
      } catch (err: any) {
        console.error("Join Error:", err);
        if (err.message === "MEETUP_FULL") {
          alert("This meetup is full!");
        } else {
          alert("Failed to join meetup. Please try again.");
        }
      }
    }
  };

  const strategicRecommendations = useMemo(() => {
    if (topMeetups.length > 0) {
      return topMeetups.map(m => ({
        title: m.title,
        time: m.timeAgo,
        type: m.mode || "Offline",
        score: m.matchPotential
      }));
    }
    const role = authUser?.role || "Business";
    return [
      { title: `${role} Growth Sync`, time: "Tomorrow, 10:00", type: "Virtual", score: 99 },
      { title: "Supply Chain Sync", time: "Friday, 14:30", type: "Technopark", score: 92 }
    ];
  }, [authUser, topMeetups]);

  return (
    <ProtectedRoute>
      <TerminalLayout>
        <div className="flex h-screen bg-white overflow-hidden selection:bg-[#E53935]/10">
        
        {/* 1. DISCOVERY HUB (LEFT) */}
        <main className="flex-1 overflow-y-auto no-scrollbar border-r border-[#292828]/5 pb-32 lg:pb-0 scroll-smooth">
           
           {/* HEADER */}
           <div className="bg-white/80 backdrop-blur-3xl border-b border-black/[0.03] sticky top-0 z-40 p-6 md:p-8">
              <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#E53935]/5 text-[#E53935] rounded-full border border-[#E53935]/10 shadow-sm">
                       <Target size={14} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Area Discovery Active</span>
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none">
                         Meetups<span className="text-[#E53935]">.</span>
                      </h1>
                      <p className="text-[12px] md:text-sm font-medium text-black/40 uppercase tracking-tight">Connect with high-signal partners in your node.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowAiArchitect(true)}
                      className="group relative overflow-hidden flex items-center gap-4 bg-black text-white p-1 rounded-2xl border border-white/10 shadow-2xl transition-all hover:scale-[1.02] active:scale-95 shrink-0"
                    >
                      <div className="h-12 w-12 md:h-14 md:w-14 bg-[#E53935] rounded-xl flex items-center justify-center text-white shadow-xl relative z-10">
                        <BrainCircuit size={24} className="group-hover:rotate-12 transition-transform" />
                      </div>
                      <div className="pr-6 relative z-10 text-left">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">AI Architect</p>
                        <p className="text-[11px] font-black uppercase tracking-tight">Plan Meeting</p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pt-4 border-t border-black/[0.03]">
                  {/* TOPIC PILLS - Right-aligned with scroll */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    <div className="flex items-center gap-1 p-1 bg-[#F5F5F7] rounded-full border border-black/[0.03] shadow-inner">
                      {TOPICS.map(t => (
                        <button 
                          key={t}
                          onClick={() => setActiveTopic(t)}
                          className={cn(
                            "px-5 h-9 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center",
                            activeTopic === t 
                              ? "bg-white text-black shadow-md shadow-black/5" 
                              : "text-black/30 hover:text-black/60"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 xl:justify-end">
                    {/* SORT MODES */}
                    <div className="flex items-center gap-1 p-1 bg-black/[0.02] rounded-xl border border-black/[0.03]">
                      {(['NEARBY', 'RELEVANT', 'UPCOMING'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setSortMode(mode)}
                          className={cn(
                            "px-4 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center",
                            sortMode === mode 
                              ? "bg-white text-black shadow-sm" 
                              : "text-black/20 hover:text-black"
                          )}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { setShowHostModal(true); setHostStep(1); }}
                        className="h-10 px-6 bg-[#E53935] text-white rounded-xl flex items-center justify-center gap-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-[#E53935]/10 active:scale-95"
                      >
                         <Plus size={16} strokeWidth={3} /> Host
                      </button>

                      <div className="h-8 w-px bg-black/[0.05] hidden md:block" />

                      <div className="flex items-center gap-1 p-1 bg-black/[0.02] rounded-lg">
                        <button onClick={() => setViewMode("grid")} className={cn("h-8 w-9 rounded-lg flex items-center justify-center transition-all", viewMode === "grid" ? "bg-white text-black shadow-sm" : "text-black/20 hover:text-black")}>
                           <LayoutGrid size={15} />
                        </button>
                        <button onClick={() => setViewMode("list")} className={cn("h-8 w-9 rounded-lg flex items-center justify-center transition-all", viewMode === "list" ? "bg-white text-black shadow-sm" : "text-black/20 hover:text-black")}>
                           <List size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
           {/* CONTENT GRID */}
           <div className="p-6 md:p-8 lg:p-12 space-y-12 md:space-y-16">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="h-12 w-12 border-4 border-[#E53935] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/20">Syncing Meetups...</p>
                </div>
              ) : meetups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center space-y-8 bg-slate-50/50 rounded-2xl border border-dashed border-black/10 p-6">
                   <div className="h-20 w-20 md:h-24 md:w-24 bg-white rounded-full flex items-center justify-center shadow-xl border border-black/5">
                      <Calendar size={40} className="text-black/10" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl md:text-2xl font-black uppercase">No meetups found nearby</h3>
                      <p className="text-slate-400 max-w-sm mx-auto text-[12px] md:text-sm font-medium">Expand your search or be the first to host a session in your current industry node.</p>
                   </div>
                   <button 
                    onClick={() => { setShowHostModal(true); setHostStep(1); }}
                    className="h-14 px-10 bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#E53935] transition-all shadow-2xl"
                   >
                     Create Meetup
                   </button>
                </div>
              ) : (
                <>
                  {/* SECTION 1: TOP MEETUPS */}
                  {topMeetups.length > 0 && (
                    <div className="space-y-8">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-[#E53935]/5 text-[#E53935] rounded-xl flex items-center justify-center">
                             <Sparkles size={20} />
                          </div>
                          <h2 className="text-xl font-black uppercase tracking-tight">Top <span className="text-[#E53935]">Meetups</span></h2>
                       </div>
                       <div className={cn(
                          "grid gap-6 md:gap-10",
                          viewMode === "grid" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
                       )}>
                          {topMeetups.map(m => (
                            <MeetupCard 
                              key={m.id} 
                              meetup={m} 
                              isJoined={userParticipants.includes(m.id)} 
                              onJoin={() => handleJoin(m.id)} 
                              viewMode={viewMode}
                            />
                          ))}
                       </div>
                    </div>
                  )}

                  {/* SECTION 2: ALL MEETUPS */}
                  {allMeetups.length > 0 && (
                    <div className="space-y-8">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-black/5 text-black rounded-xl flex items-center justify-center">
                             <List size={20} />
                          </div>
                          <h2 className="text-xl font-black uppercase tracking-tight">All <span className="text-slate-300">Meetups</span></h2>
                       </div>
                       <div className={cn(
                          "grid gap-6 md:gap-10",
                          viewMode === "grid" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
                       )}>
                          {allMeetups.map(m => (
                            <MeetupCard 
                              key={m.id} 
                              meetup={m} 
                              isJoined={userParticipants.includes(m.id)} 
                              onJoin={() => handleJoin(m.id)} 
                              viewMode={viewMode}
                            />
                          ))}
                       </div>
                    </div>
                  )}
                </>
              )}
           </div>

        </main>
  
        {/* 2. ANALYTICS SIDEBAR (RIGHT) */}
        <aside className="hidden xl:flex flex-col w-[420px] bg-[#FDFDFF] border-l border-[#292828]/10 p-10 gap-10 overflow-y-auto no-scrollbar">
           
           {/* AI PLANNER STATUS */}
           <section className="space-y-6">
              <div className="flex items-center justify-between">
                 <p className="subheading-editorial !text-slate-200">Meeting Planner</p>
                 <div className="flex items-center gap-2 text-emerald-600">
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[9px] font-bold uppercase  font-outfit">Active</span>
                 </div>
              </div>
  
              <div className="p-8 bg-gradient-to-br from-[#292828] to-black rounded-lg text-white relative overflow-hidden group shadow-2xl">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#E53935]/20 blur-[60px] pointer-events-none" />
                 <BrainCircuit size={160} className="absolute -bottom-16 -right-16 text-white/[0.03] group-hover:rotate-12 transition-transform duration-[4s]" />
                 
                 <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="h-12 w-12 bg-[#E53935] rounded-lg flex items-center justify-center text-white shadow-xl">
                          <Sparkles size={24} />
                       </div>
                       <div>
                          <p className="text-[13px] font-bold uppercase ">AI Strategy Insight</p>
                          <p className="text-[9px] font-bold text-white/40 uppercase  mt-0.5 leading-none">Contextual Analysis</p>
                       </div>
                    </div>
                    
                    <p className="text-[14px] font-medium text-white/70 leading-relaxed mb-8 uppercase ">
                       "Select a category to see high-probability match opportunities in your current location."
                    </p>
                    
                    <button onClick={() => setShowAiArchitect(true)} className="w-full h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-[10px] font-bold uppercase  hover:bg-white hover:text-[#292828] transition-all">
                       Open Suggestion Box
                    </button>
                 </div>
              </div>
           </section>
  
           {/* NEARBY HEATMAP */}
           <section className="space-y-6">
              <p className="subheading-editorial !text-slate-200">Meetup Activity Map</p>
              <div className="h-64 bg-slate-50 border-4 border-white shadow-xl rounded-lg relative overflow-hidden group cursor-crosshair">
                 <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#292828_2px,transparent_2px)] [background-size:24px_24px]" />
                 
                 {/* Map Pins */}
                 {meetups.map(m => (
                   <div key={`pin-${m.id}`} className="absolute transition-all duration-700" style={{ top: `${m.y}%`, left: `${m.x}%` }}>
                      <div className={cn(
                        "h-10 w-10 rounded-lg border-4 border-white shadow-2xl flex items-center justify-center text-lg transition-transform hover:scale-125 hover:z-10",
                        m.status === "joined" ? "bg-emerald-500 scale-110" : "bg-[#292828] text-white hover:bg-[#E53935]"
                      )}>
                         {m.category === "Tech" ? "" : m.category === "Logistics" ? "" : ""}
                      </div>
                   </div>
                 ))}
  
                 <div className="absolute bottom-6 inset-x-6 flex items-center justify-between bg-white/90 backdrop-blur-md p-5 rounded-lg border border-[#292828]/5 shadow-xl">
                    <div>
                       <p className="text-[13px] font-bold text-[#292828] uppercase leading-none mb-1.5">Local Network</p>
                       <p className="text-[9px] font-bold text-emerald-600 uppercase ">{meetups.length} Active Sessions</p>
                    </div>
                    <div className="h-10 w-10 bg-[#292828] rounded-lg flex items-center justify-center text-white hover:bg-[#E53935] transition-colors">
                       <Maximize2 size={16} />
                    </div>
                 </div>
              </div>
           </section>
  
            <section className="mt-auto space-y-6">
              <p className="subheading-editorial !text-slate-200">Upcoming Sessions</p>
              <div className="space-y-4">
                 {strategicRecommendations.map((block, i) => (
                   <div key={i} className="p-5 bg-white border border-[#292828]/5 rounded-lg hover:border-[#E53935]/20 hover:shadow-xl transition-all cursor-pointer group/block">
                      <div className="flex items-center justify-between mb-4">
                         <span className="px-3 py-1 bg-white border border-[#292828]/10 rounded-lg text-[8px] font-bold uppercase ">{block.type}</span>
                         <div className="flex items-center gap-1.5 text-[#E53935]">
                            <Zap size={14} fill="currentColor" />
                            <span className="text-[11px] font-bold">{block.score}%</span>
                         </div>
                      </div>
                      <h4 className="text-[14px] font-bold text-[#292828] uppercase leading-tight group-hover/block:text-[#E53935] transition-colors">{block.title}</h4>
                      <p className="text-[10px] font-bold text-[#292828]/30 uppercase mt-1.5">{block.time}</p>
                   </div>
                 ))}
              </div>
            </section>
        </aside>
  
        {/* AI PLANNER DRAWER */}
        {showAiArchitect && (
          <div className="fixed inset-0 z-[100] flex justify-end">
             <div className="absolute inset-0 bg-[#292828]/40 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowAiArchitect(false)} />
             <aside className="relative w-full max-w-xl bg-white h-full shadow-[-40px_0_100px_rgba(0,0,0,0.1)] flex flex-col p-12 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-500">
                <div className="flex items-center justify-between mb-12">
                   <div>
                      <div className="label-premium">
                         Meeting OS v3.0
                      </div>
                      <h2>AI <span className="text-[#E53935] italic">Planner</span></h2>
                   </div>
                   <button onClick={() => setShowAiArchitect(false)} className="h-14 w-14 bg-[#292828]/5 text-[#292828] rounded-lg flex items-center justify-center hover:bg-[#E53935] hover:text-white transition-all active:scale-95">
                      <Check size={28} />
                   </button>
                </div>
  
                 <div className="space-y-12">
                   <section className="space-y-6">
                      <p className="subheading-editorial !text-slate-200">Active Objectives</p>
                      <div className="space-y-3">
                         {["Schedule series A sync", "Find logistics provider", "Arrange venue for Friday"].map((ob, i) => (
                           <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i} 
                            onClick={() => {
                              setShowAiArchitect(false);
                              setShowHostModal(true);
                              setHostStep(1);
                            }}
                            className="flex items-center justify-between p-5 bg-white border border-[#292828]/10 rounded-lg group hover:border-[#E53935] transition-all cursor-pointer shadow-sm hover:shadow-xl active:scale-[0.98]"
                           >
                              <span className="text-[14px] font-medium text-[#292828] uppercase">{ob}</span>
                              <div className="h-8 w-8 bg-[#292828]/5 rounded-lg flex items-center justify-center text-[#292828]/30 group-hover:text-[#E53935] transition-colors">
                                 <ChevronRight size={18} />
                              </div>
                           </motion.div>
                         ))}
                      </div>
                   </section>
   
                   <section className="relative p-10 bg-[#E53935] rounded-2xl text-white space-y-8 overflow-hidden shadow-4xl group/card">
                      {/* WHEEL ANIMATION BACKGROUND */}
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-24 -right-24 h-64 w-64 border-[32px] border-white/5 rounded-full pointer-events-none"
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-12 -right-12 h-48 w-48 border-[16px] border-white/5 rounded-full pointer-events-none"
                      />
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                          <Sparkles size={20} className="text-white" />
                        </div>
                        <p className="subheading-editorial !text-white/40 !mb-0">Strategic Suggestion</p>
                      </div>

                      <div className="relative z-10 space-y-6">
                        <p className="text-[19px] font-black leading-tight tracking-tight uppercase italic">
                           {filteredMeetups[0] ? (
                             <>
                               Based on your <span className="text-white/60">{filteredMeetups[0].matchPotential}% alignment</span>, I recommend joining the <span className="underline decoration-white/40 underline-offset-4">{filteredMeetups[0].title}</span> today.
                             </>
                           ) : (
                             "Network activity is stabilizing. I recommend hosting a community sync to catalyze local hub growth."
                           )}
                        </p>
                        <button 
                          onClick={() => {
                            setShowAiArchitect(false);
                            setShowHostModal(true);
                            setHostStep(1);
                          }}
                          className="w-full h-16 bg-white text-[#E53935] rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl relative z-10 hover:scale-[1.02] active:scale-95 transition-all group-hover/card:bg-black group-hover/card:text-white"
                        >
                           Auto-Plan meeting
                        </button>
                      </div>
                   </section>
   
                   <section className="space-y-6">
                      <p className="subheading-editorial !text-slate-200">Contextual Data</p>
                      <div className="grid grid-cols-2 gap-4">
                         <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-8 bg-slate-50/50 border border-slate-100 rounded-2xl group/data hover:bg-white hover:shadow-2xl transition-all"
                         >
                            <div className="flex items-center gap-2 mb-4">
                              <Target size={12} className="text-emerald-500" />
                              <p className="text-[9px] font-black text-[#292828]/40 uppercase tracking-widest">Venue Match</p>
                            </div>
                            <p className="text-3xl font-black text-[#292828] group-hover/data:text-[#E53935] transition-colors">
                              {filteredMeetups[0]?.matchPotential || 88}<span className="text-[14px] opacity-30">%</span>
                            </p>
                         </motion.div>
                         <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="p-8 bg-slate-50/50 border border-slate-100 rounded-2xl group/data hover:bg-white hover:shadow-2xl transition-all"
                         >
                            <div className="flex items-center gap-2 mb-4">
                              <Users size={12} className="text-indigo-500" />
                              <p className="text-[9px] font-black text-[#292828]/40 uppercase tracking-widest">Network Reach</p>
                            </div>
                            <p className="text-3xl font-black text-[#292828] group-hover/data:text-[#E53935] transition-colors">
                              {meetups.length * 1.2 || 12.4}<span className="text-[14px] opacity-30">k</span>
                            </p>
                         </motion.div>
                      </div>
                   </section>
                 </div>
             </aside>
          </div>
        )}
  
        {/* HOST WIZARD */}
        <AnimatePresence>
          {showHostModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-[#292828]/80 backdrop-blur-2xl" 
                 onClick={() => setShowHostModal(false)} 
               />
               
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-4xl"
               >
                  {/* PROGRESS BAR */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-[#F5F5F7]">
                     <motion.div 
                       initial={{ width: "33%" }}
                       animate={{ width: `${(hostStep / 3) * 100}%` }}
                       className="h-full bg-[#E53935]"
                     />
                  </div>
  
                  <div className="p-12 md:p-16">
                     <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-[#E53935]/5 text-[#E53935] rounded-xl flex items-center justify-center font-black text-sm">
                              0{hostStep}
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">Step {hostStep} of 4</p>
                        </div>
                        <button onClick={() => setShowHostModal(false)} className="text-black/20 hover:text-black transition-colors">
                           <X size={24} />
                        </button>
                     </div>
  
                     <AnimatePresence mode="wait">
                        {hostStep === 1 && (
                          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                             <div className="space-y-4">
                                <h2 className="text-4xl font-black uppercase font-outfit">Select <span className="text-[#E53935] italic">System</span></h2>
                                <p className="text-[13px] font-bold text-black/30 uppercase tracking-widest">Choose how your meetup is organized.</p>
                             </div>
                             <div className="grid grid-cols-1 gap-4">
                                <button onClick={() => setMeetupType("Open")} className={cn("p-8 rounded-2xl border-2 text-left transition-all", meetupType === "Open" ? "border-[#E53935] bg-[#E53935]/5 shadow-xl" : "border-[#F5F5F7] hover:border-[#E53935]/20")}>
                                   <h4 className="text-xl font-black uppercase mb-1">Open Meetup</h4>
                                   <p className="text-[11px] font-bold text-black/40 uppercase">Visible to all relevant industry nodes.</p>
                                </button>
                                <button onClick={() => setMeetupType("Advisor")} className={cn("p-8 rounded-2xl border-2 text-left transition-all", meetupType === "Advisor" ? "border-[#E53935] bg-[#E53935]/5 shadow-xl" : "border-[#F5F5F7] hover:border-[#E53935]/20")}>
                                   <h4 className="text-xl font-black uppercase mb-1">Advisor Meetup <span className="ml-2 text-[10px] bg-[#E53935] text-white px-2 py-0.5 rounded">PREMIUM</span></h4>
                                   <p className="text-[11px] font-bold text-black/40 uppercase">Requires domain expert approval. High Signal.</p>
                                </button>
                             </div>
                          </motion.div>
                        )}
  
                        {hostStep === 2 && (
                          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                             <div className="space-y-4">
                                <h2 className="text-4xl font-black uppercase font-outfit">The <span className="text-[#E53935] italic">Agenda</span></h2>
                                <p className="text-[13px] font-bold text-black/30 uppercase tracking-widest">What are we building/solving?</p>
                             </div>
                             <div className="space-y-6">
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black text-black/20 uppercase ml-4">Title</label>
                                   <input type="text" placeholder="e.g. Series A Logistics Sync" className="w-full h-18 bg-[#F5F5F7] rounded-2xl px-8 text-lg font-bold outline-none border-2 border-transparent focus:border-[#E53935]/20 focus:bg-white transition-all shadow-inner" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   {TOPICS.filter(t => t !== "All").map(t => (
                                     <button key={t} className="h-16 bg-[#F5F5F7] rounded-2xl border-2 border-transparent hover:border-[#E53935]/40 hover:bg-white transition-all flex items-center justify-center text-[10px] font-black uppercase">{t}</button>
                                   ))}
                                </div>
                             </div>
                          </motion.div>
                        )}
  
                        {hostStep === 3 && meetupType === "Advisor" && (
                          <motion.div key="step3-advisor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                             <div className="space-y-4">
                                <h2 className="text-4xl font-black uppercase font-outfit">Match <span className="text-[#E53935] italic">Expert</span></h2>
                                <p className="text-[13px] font-bold text-black/30 uppercase tracking-widest">Select an advisor to lead this session.</p>
                             </div>
                             <div className="space-y-4">
                                {suggestedAdvisors.map(adv => (
                                  <button key={adv.id} onClick={() => setSelectedAdvisor(adv)} className={cn("w-full p-6 rounded-2xl border-2 flex items-center gap-6 transition-all", selectedAdvisor?.id === adv.id ? "border-[#E53935] bg-[#E53935]/5 shadow-xl" : "border-[#F5F5F7] hover:border-[#E53935]/20")}>
                                     <div className="h-16 w-16 bg-slate-200 rounded-xl overflow-hidden shrink-0"><img src={adv.avatar_url || `https://i.pravatar.cc/150?u=${adv.id}`} className="w-full h-full object-cover" alt="" /></div>
                                     <div className="text-left">
                                        <h4 className="text-lg font-black uppercase leading-none mb-1">{adv.full_name}</h4>
                                        <p className="text-[10px] font-bold text-black/30 uppercase">{adv.role}  98% Match</p>
                                     </div>
                                  </button>
                                ))}
                             </div>
                          </motion.div>
                        )}
  
                        {(hostStep === 3 && meetupType === "Open" || hostStep === 4) && (
                          <motion.div key="step-logistics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                             <div className="space-y-4">
                                <h2 className="text-4xl font-black uppercase font-outfit">Final <span className="text-[#E53935] italic">Step</span></h2>
                                <p className="text-[13px] font-bold text-black/30 uppercase tracking-widest">Location, Time & Capacity (Max 8).</p>
                             </div>
                             <div className="space-y-6">
                                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                                   <Users size={24} className="text-emerald-500" />
                                   <p className="text-[11px] font-bold text-emerald-700 uppercase">Limit: <span className="font-black">8 Participants</span> for high-quality sync.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="p-6 bg-[#F5F5F7] rounded-2xl flex items-center justify-between"><p className="text-[11px] font-black uppercase">Today</p><Calendar size={18} className="text-black/20" /></div>
                                   <div className="p-6 bg-[#F5F5F7] rounded-2xl flex items-center justify-between"><p className="text-[11px] font-black uppercase">18:30</p><Clock size={18} className="text-black/20" /></div>
                                </div>
                             </div>
                          </motion.div>
                        )}
                     </AnimatePresence>
  
                     <div className="mt-16 flex items-center gap-4">
                        {hostStep > 1 && (
                          <button onClick={() => setHostStep(hostStep - 1)} className="h-18 px-8 rounded-2xl bg-[#F5F5F7] text-black font-black text-[11px] uppercase tracking-widest hover:bg-black hover:text-white transition-all">Back</button>
                        )}
                        <button 
                          onClick={() => {
                            const totalSteps = meetupType === "Advisor" ? 4 : 3;
                            if (hostStep < totalSteps) setHostStep(hostStep + 1);
                            else setShowHostModal(false);
                          }}
                          className="flex-1 h-18 bg-[#292828] text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-2xl hover:bg-[#E53935] transition-all flex items-center justify-center gap-4"
                        >
                           {hostStep === (meetupType === "Advisor" ? 4 : 3) ? "Launch Meetup" : "Continue"}
                           <ChevronRight size={18} />
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
        </div>
      </TerminalLayout>
    </ProtectedRoute>
  );
}


