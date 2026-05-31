"use client";
import React, { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { 
  Search, 
  Filter, 
  Zap, 
  ChevronRight,
  Sparkles,
  Award,
  Target,
  LayoutGrid,
  List
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Advisor } from "@/types/advisors";
import { DEFAULT_AVATAR } from "@/utils/constants";
import { createClient } from "@/utils/supabase/client";
import { ConnectButton } from "@/components/connection/ConnectButton";
import { analytics } from "@/utils/analytics";
import { useAuth } from "@/hooks/useAuth";
import TerminalLayout from "@/components/layout/TerminalLayout";

export default function AdvisorsPage() {
  return (
    <ProtectedRoute>
      <AdvisorsContent />
    </ProtectedRoute>
  );
}

function AdvisorsContent() {
  const { user: authUser } = useAuth();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState("Best Match");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const router = useRouter();

  useEffect(() => {
    async function loadAdvisors() {
      if (!authUser) return;
      const supabase = createClient();
      try {
        const { data } = await supabase.from('profiles').select('*').eq('role', 'ADVISOR').neq('id', authUser.id).limit(20);
        const { data: connections } = await supabase.from('connections').select('sender_id, receiver_id, status').or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`);
        if (data) {
          const mapped = data.filter(p => {
            const conn = (connections || []).find(c => (c.sender_id === authUser.id && c.receiver_id === p.id) || (c.receiver_id === authUser.id && c.sender_id === p.id));
            return conn?.status !== 'BLOCKED';
          }).map(p => ({
            id: p.id,
            name: p.full_name || "Member",
            role: p.headline || p.role || "Professional",
            industry: p.city || "Member",
            experience: p.experience_years ? `${p.experience_years}+ Years` : "",
            expertise: p.skills || p.expertise || [],
            avatar: p.avatar_url || DEFAULT_AVATAR,
            matchScore: p.matchScore || 0,
            bestFor: p.bio?.substring(0, 100) || "",
            bio: p.bio || "",
            connectionStatus: 'none'
          }));
          setAdvisors(mapped);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    loadAdvisors();
    analytics.trackScreen('ADVISORS');
  }, [authUser]);

  const filteredAdvisors = advisors.filter(advisor => 
    advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    advisor.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <TerminalLayout
      topbarChildren={
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6 flex-1 max-w-5xl py-2 lg:py-0">
          {/* SEARCH */}
          <div className="flex-1 relative group w-full lg:max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#E53935] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search advisors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 md:h-10 bg-[#F5F5F7] border border-black/[0.03] rounded-xl pl-11 pr-4 text-[12px] font-bold text-black outline-none focus:bg-white focus:border-black/[0.08] transition-all"
            />
          </div>

          {/* SORT CONTROLS */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            <span className="text-[9px] font-black uppercase text-black/20 tracking-widest mr-1 hidden sm:inline">Sort:</span>
            <div className="flex p-1 bg-[#F5F5F7] rounded-xl border border-black/[0.03]">
              {["Match", "Exp", "Active"].map(sort => (
                <button 
                  key={sort}
                  onClick={() => setActiveSort(sort)}
                  className={cn(
                    "px-4 h-7 md:h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    activeSort.startsWith(sort) ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black"
                  )}
                >
                  {sort}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="bg-[#FDFDFF] min-h-screen">
        {/* VIEW SWITCHER ROW */}
        <div className="bg-white border-b border-black/[0.03] px-4 md:px-8 py-3 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
             <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-black/20">Advisor Network</h3>
             <div className="flex items-center gap-1 p-1 bg-[#F5F5F7] rounded-xl border border-black/[0.03]">
                <button 
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                    viewMode === "list" ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black"
                  )}
                >
                   <List size={16} />
                </button>
                <button 
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                    viewMode === "grid" ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black"
                  )}
                >
                   <LayoutGrid size={16} />
                </button>
             </div>
          </div>
        </div>

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 md:space-y-12">

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-[#F5F5F7] rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredAdvisors.length > 0 ? (
          <>
            {/* TOP MATCHES */}
            <section>
              <div className="flex items-center gap-3 text-[#E53935] mb-6 md:mb-8">
                <Sparkles size={20} fill="currentColor" />
                <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-black/20">Elite Advisors</h2>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-6 pb-6 -mx-6 px-6 md:mx-0 md:px-0">
                {filteredAdvisors.filter(a => a.matchScore > 90).map((advisor) => (
                  <div key={advisor.id} onClick={() => router.push(`/advisors/${advisor.id}`)} className="min-w-[280px] md:min-w-[400px] bg-white rounded-2xl p-6 md:p-10 border border-black/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6 md:mb-8">
                      <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl overflow-hidden border-4 border-[#F5F5F7] shadow-lg"><img src={advisor.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" /></div>
                      <div className="relative h-12 w-12 md:h-16 md:w-16 flex items-center justify-center"><svg className="w-full h-full" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#F5F5F7" strokeWidth="8" /><circle cx="50" cy="50" r="45" fill="none" stroke="#E53935" strokeWidth="8" strokeDasharray={2 * Math.PI * 45} strokeDashoffset={(2 * Math.PI * 45) * (1 - advisor.matchScore / 100)} strokeLinecap="round" /></svg><span className="absolute text-[10px] md:text-[12px] font-black text-black font-outfit">{advisor.matchScore}%</span></div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-[#1D1D1F] uppercase font-outfit mb-2 group-hover:text-[#E53935] transition-colors line-clamp-1">{advisor.name}</h3>
                    <p className="text-[9px] md:text-[10px] font-black text-black/20 uppercase tracking-widest mb-6">{advisor.role}  {advisor.industry}</p>
                    <div className="p-4 md:p-6 bg-[#F5F5F7] rounded-2xl border border-black/[0.02] mb-6 md:mb-8"><p className="text-[11px] md:text-xs font-bold text-black/60 leading-relaxed italic uppercase line-clamp-2">"{advisor.bestFor}"</p></div>
                    <div className="mt-auto pt-6 border-t border-black/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex items-center gap-2"><Award size={16} className="text-emerald-500" /><span className="text-[9px] md:text-[10px] font-black text-black uppercase tracking-widest">{advisor.experience} Exp</span></div><ConnectButton userId={advisor.id} userName={advisor.name} label="Start Conversation" /></div>
                  </div>
                ))}
              </div>
            </section>

            {/* FULL LIST / GRID */}
            <main className={cn(
              "transition-all duration-500",
              viewMode === "list" ? "space-y-4 md:space-y-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            )}>
              {filteredAdvisors.map((advisor) => (
                <AdvisorCard key={advisor.id} advisor={advisor} viewMode={viewMode} />
              ))}
            </main>
          </>
        ) : (
          <div className="py-40 text-center space-y-6">
            <div className="h-20 w-20 bg-[#F5F5F7] rounded-2xl mx-auto flex items-center justify-center text-black/10"><Zap size={32} /></div>
            <h3 className="text-xl font-black text-[#1D1D1F] uppercase font-outfit">No experts found</h3>
            <p className="text-black/20 text-[11px] font-black uppercase tracking-widest">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  </TerminalLayout>
  );
}

function AdvisorCard({ advisor, viewMode }: { advisor: Advisor; viewMode: "list" | "grid" }) {
  const router = useRouter();
  
  if (viewMode === "list") {
    return (
      <div onClick={() => router.push(`/advisors/${advisor.id}`)} className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
        <div className="h-20 w-20 md:h-28 md:w-28 shrink-0 rounded-2xl overflow-hidden border-4 border-[#F5F5F7] shadow-md group-hover:rotate-3 transition-all duration-500">
          <img src={advisor.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="px-2.5 py-1 bg-[#E53935]/5 text-[#E53935] rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
               <Target size={12} /> {advisor.matchScore}% Match
            </div>
            <span className="text-[9px] font-black text-black/20 uppercase tracking-widest whitespace-nowrap">{advisor.experience}</span>
          </div>
          <h3 className="text-lg md:text-xl font-black text-[#1D1D1F] uppercase font-outfit mb-1 group-hover:text-[#E53935] transition-colors truncate">{advisor.name}</h3>
          <p className="text-[9px] md:text-[10px] font-black text-black/20 uppercase tracking-widest mb-4 truncate">{advisor.role}  {advisor.industry}</p>
          <div className="flex flex-wrap gap-2">
            {advisor.expertise.slice(0, 4).map(tag => (
              <span key={tag} className="px-3 py-1 bg-[#F5F5F7] text-black/40 rounded-lg text-[8px] font-black uppercase tracking-widest">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <ConnectButton userId={advisor.id} userName={advisor.name} label="Start Conversation" className="w-full" />
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => router.push(`/advisors/${advisor.id}`)} className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden border-4 border-[#F5F5F7] shadow-md group-hover:scale-105 transition-all duration-500">
          <img src={advisor.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className="px-2 py-0.5 md:px-2.5 md:py-1 bg-[#E53935]/5 text-[#E53935] rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Target size={10} /> {advisor.matchScore}%
           </div>
           <span className="text-[8px] font-black text-black/20 uppercase tracking-widest">{advisor.experience}</span>
        </div>
      </div>
      
      <div className="flex-1 space-y-2 mb-6">
        <h3 className="text-lg font-black text-[#1D1D1F] uppercase font-outfit group-hover:text-[#E53935] transition-colors leading-tight line-clamp-2">{advisor.name}</h3>
        <p className="text-[9px] font-black text-black/20 uppercase tracking-widest line-clamp-1">{advisor.role}</p>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {advisor.expertise.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-[#F5F5F7] text-black/40 rounded-md text-[7px] font-black uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-black/[0.03]">
         <ConnectButton userId={advisor.id} userName={advisor.name} label="Start Conversation" className="w-full" />
      </div>
    </div>
  );
}


