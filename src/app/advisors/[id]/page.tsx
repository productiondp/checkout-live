"use client";
import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  MessageSquare,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import TerminalLayout from "@/components/layout/TerminalLayout";

export default function AdvisorProfilePage() {
  return (
    <ProtectedRoute>
      <AdvisorProfileContent />
    </ProtectedRoute>
  );
}

function AdvisorProfileContent() {
  const params = useParams();
  const router = useRouter();
  const advisorId = params.id as string;
  
  const [advisor, setAdvisor] = React.useState<any>(null);
  const [meetups, setMeetups] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop";

  React.useEffect(() => {
    if (!advisorId) return;
    let isMounted = true;
    const fetchData = async (forceRefresh = false) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/advisors/${advisorId}`);
        if (!response.ok) throw new Error("API call failed");
        const data = await response.json();
        if (!isMounted) return;
        const rawAdvisor = data.advisor;
        const normalizedAdvisor = {
          ...rawAdvisor,
          name: rawAdvisor.full_name || rawAdvisor.name || "Advisor",
          avatar: rawAdvisor.avatar_url || rawAdvisor.avatar || FALLBACK_AVATAR,
          score: Number(rawAdvisor.advisor_score) || 0,
          role: rawAdvisor.professional_role || rawAdvisor.role || "Advisor",
          industry: rawAdvisor.industry || "Tech",
          bio: rawAdvisor.bio || ""
        };
        setAdvisor(normalizedAdvisor);
        setMeetups(data.meetups || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load advisor safely");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
  }, [advisorId]);

  if (loading) return <TerminalLayout><div className="flex h-full items-center justify-center p-20 text-[10px] font-black uppercase text-black/10 animate-pulse">Loading advisor...</div></TerminalLayout>;

  if (error || !advisor) return <TerminalLayout><div className="p-20 text-center space-y-6"><h3 className="text-xl font-black text-[#1D1D1F] uppercase font-outfit">Advisor not found</h3><button onClick={() => router.push('/advisors')} className="h-12 px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase">Back to Directory</button></div></TerminalLayout>;

  return (
    <TerminalLayout
      topbarChildren={
         <div className="flex items-center gap-6">
            <button 
               onClick={() => router.push('/advisors')}
               className="h-10 px-4 bg-[#F5F5F7] text-black/40 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-black transition-all"
            >
               <ArrowLeft size={14} /> Back
            </button>
         </div>
      }
    >
      <div className="p-8 max-w-4xl mx-auto space-y-12">
         {/* HERO */}
         <div className="bg-white rounded-2xl p-10 border border-black/[0.03] shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-8 mb-10">
               <div className="h-28 w-28 rounded-2xl overflow-hidden border-4 border-[#F5F5F7] shadow-lg shrink-0"><img src={advisor.avatar} className="w-full h-full object-cover grayscale" alt="" /></div>
               <div>
                  <div className="flex items-center gap-2 mb-2"><h1 className="text-3xl font-black text-[#1D1D1F] uppercase font-outfit leading-none">{advisor.name}</h1>{advisor.score >= 4.0 && <ShieldCheck size={20} className="text-emerald-500" />}</div>
                  <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">{advisor.role}  {advisor.industry}</p>
               </div>
            </div>
            {advisor.bio && <p className="text-2xl font-black text-black uppercase font-outfit leading-tight italic mb-10">"{advisor.bio}"</p>}
            <div className="flex gap-4">
               <button 
                onClick={() => {
                  const el = document.getElementById('sessions-list');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-14 px-10 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#E53935] transition-all flex items-center gap-2"
               >
                 <Zap size={16} fill="currentColor" /> Join Meetup
               </button>
               <button 
                  onClick={() => router.push(`/chat?user=${advisor.id}`)}
                  className="h-14 px-10 bg-[#F5F5F7] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
               >
                  Start Conversation
               </button>
            </div>
         </div>

         {/* TRUST BLOCK */}
         <section>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20 mb-8 flex items-center gap-2"><TrendingUp size={16} /> Performance Signals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white rounded-2xl border border-black/[0.03] p-10 flex items-center justify-between">
                  <div><p className="text-[9px] font-black text-black/20 uppercase tracking-widest mb-1">Trust Score</p><p className="text-5xl font-black font-outfit text-black">{advisor.score.toFixed(1)}</p></div>
                  <div className="flex gap-1">{[1,2,3,4,5].map(i => <Sparkles key={i} size={14} className={cn(i <= Math.round(advisor.score) ? "text-amber-400 fill-amber-400" : "text-black/5")} />)}</div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-black/[0.03] p-6"><p className="text-[20px] font-black text-black font-outfit">{advisor.sessions_count || 0}</p><p className="text-[8px] font-black text-black/20 uppercase tracking-widest">Sessions</p></div>
                  <div className="bg-white rounded-2xl border border-black/[0.03] p-6"><p className="text-[20px] font-black text-emerald-500 font-outfit">{advisor.helpfulness_rating || '--'}%</p><p className="text-[8px] font-black text-black/20 uppercase tracking-widest">Helpful</p></div>
               </div>
            </div>
         </section>

         {/* MEETUPS */}
         <section id="sessions-list">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20 mb-8">Available Sessions</h3>
            <div className="space-y-4">
               {meetups.length === 0 ? <div className="p-20 text-center bg-[#F5F5F7] rounded-2xl text-black/10 text-[10px] font-black uppercase tracking-widest">No upcoming sessions</div> : meetups.map(m => (
                  <div key={m.id} className="p-8 bg-white border border-black/[0.03] rounded-2xl hover:border-[#E53935]/20 hover:shadow-xl transition-all flex items-center justify-between">
                     <div>
                        <h4 className="text-[16px] font-black text-black uppercase font-outfit mb-2">{m.title}</h4>
                        <div className="flex items-center gap-3">
                           <span className="text-[9px] font-black text-black/20 uppercase tracking-widest"><Clock size={12} className="inline mr-1" /> {m.metadata?.timeline || 'Upcoming'}</span>
                           <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase">{m.max_slots - (m.participant_count || 0)} seats left</span>
                        </div>
                     </div>
                     <button 
                        onClick={async () => {
                           try {
                              const { MeetupService } = await import("@/services/meetup-service");
                              const { data: { user } } = await (await import("@/utils/supabase/client")).createClient().auth.getUser();
                              if (!user) { router.push('/'); return; }
                              const { roomId } = await MeetupService.joinMeetup(m.id, user.id);
                              if (roomId) router.push(`/chat?room=${roomId}`);
                              else {
                                 // Fallback to post metadata if room_id not returned
                                 if (m.room_id) router.push(`/chat?room=${m.room_id}`);
                                 else alert("Preparing group chat...");
                              }
                           } catch (err) {
                              console.error(err);
                              alert("Failed to join session.");
                           }
                        }} 
                        className="h-12 px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E53935] shadow-lg transition-all"
                     >
                        Join Session
                     </button>
                  </div>
               ))}
            </div>
         </section>
      </div>
    </TerminalLayout>
  );
}


