"use client";
import React, { useState, useEffect } from "react";
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  TrendingUp,
  Zap,
  Clock,
  Globe,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import TerminalLayout from "@/components/layout/TerminalLayout";

type EventTab = "Upcoming" | "Ongoing" | "Past";

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<EventTab>("Upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from("posts")
          .select(`
            id,
            title,
            content,
            type,
            metadata,
            location,
            created_at,
            author:profiles!posts_author_id_fkey(id, full_name, avatar_url)
          `)
          .eq("type", "MEETUP")
          .order("created_at", { ascending: false })
          .limit(30);

        setEvents(data || []);
      } catch (err) {
        console.error("Events fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      event.title?.toLowerCase().includes(q) || 
      event.content?.toLowerCase().includes(q) ||
      event.location?.toLowerCase().includes(q);
    return matchesSearch;
  });

  const featuredEvents = filteredEvents.slice(0, 3);

  return (
    <TerminalLayout
      topbarChildren={
         <div className="flex items-center gap-6">
            <div className="flex p-1 bg-[#F5F5F7] rounded-2xl border border-black/[0.03]">
               {(["Upcoming", "Ongoing", "Past"] as EventTab[]).map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={cn(
                     "px-6 h-9 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative",
                     activeTab === tab ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black"
                   )}
                 >
                   {tab}
                 </button>
               ))}
            </div>
            <button 
              onClick={() => router.push('/home')}
              className="h-10 px-6 bg-black text-white rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#E53935] shadow-lg active:scale-95"
            >
              <Plus size={14} /> Host
            </button>
         </div>
      }
    >
      <div className="p-8 max-w-7xl mx-auto space-y-12">
        {/* SEARCH SECTION */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/10 group-focus-within:text-[#E53935] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search meetups, venues, or topics..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-16 bg-white border border-black/[0.03] rounded-2xl pl-16 pr-6 text-sm font-bold text-[#1D1D1F] outline-none focus:bg-white focus:border-[#E53935]/20 transition-all shadow-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-[#E53935]" />
          </div>
        ) : (
          <>
            {/* FEATURED SECTION */}
            {featuredEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-3 text-[#E53935] mb-8">
                  <Zap size={20} fill="currentColor" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20">Recent Meetups</h2>
                </div>
                
                <div className="flex overflow-x-auto no-scrollbar gap-6 pb-6">
                  {featuredEvents.map((event) => (
                    <div key={event.id} className="min-w-[480px] bg-white rounded-2xl overflow-hidden border border-black/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group">
                      <div className="h-56 relative overflow-hidden bg-gradient-to-br from-[#1D1D1F] to-[#E53935]/20">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-6 left-6"><div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-2xl text-[8px] font-black uppercase text-[#E53935] tracking-widest">Meetup</div></div>
                        <div className="absolute bottom-6 left-6">
                          <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{event.location || "Online"}</p>
                        </div>
                      </div>
                      <div className="p-10">
                        <h3 className="text-2xl font-black text-[#1D1D1F] mb-6 group-hover:text-[#E53935] transition-colors leading-tight uppercase font-outfit">{event.title}</h3>
                        <div className="space-y-3">
                           <div className="flex items-center gap-3 text-black/20 font-black uppercase text-[10px] tracking-widest"><Calendar size={16} />{new Date(event.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                           <div className="flex items-center gap-3 text-black/20 font-black uppercase text-[10px] tracking-widest"><MapPin size={16} />{event.location || "Online"}</div>
                        </div>
                        <div className="flex items-center justify-between mt-10 pt-8 border-t border-black/[0.03]">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full overflow-hidden border border-black/5">
                              <img src={event.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.author?.full_name}`} className="w-full h-full object-cover" alt="" />
                            </div>
                            <span className="text-[10px] font-black text-black/40 uppercase">{event.author?.full_name || "Host"}</span>
                          </div>
                          <button 
                            onClick={() => router.push(`/chat?user=${event.author?.id}`)}
                            className="h-12 px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-[#E53935] transition-all"
                          >
                            Join Meetup
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* MAIN LIST */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {filteredEvents.length === 0 && (
                <div className="py-32 text-center bg-white rounded-2xl border border-black/[0.03]">
                  <div className="h-20 w-20 bg-[#F5F5F7] rounded-2xl mx-auto flex items-center justify-center text-black/10 mb-8"><Calendar size={32} /></div>
                  <h3 className="text-xl font-black text-[#1D1D1F] uppercase font-outfit">No Meetups Found</h3>
                  <p className="text-black/20 text-[11px] font-black uppercase tracking-widest mt-2">Post a meetup from the marketplace to get started.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </TerminalLayout>
  );
}

function EventCard({ event }: { event: any }) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-black/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full">
      <div className="h-48 relative overflow-hidden bg-gradient-to-br from-[#1D1D1F] to-[#E53935]/20">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[9px] font-black text-[#E53935] uppercase tracking-widest">Meetup</span>
          <span className="h-1 w-1 bg-black/5 rounded-full" />
          <span className="text-[9px] font-black text-black/20 uppercase tracking-widest">{event.location || "Online"}</span>
        </div>
        <h3 className="text-xl font-black text-[#1D1D1F] mb-6 group-hover:text-[#E53935] transition-colors leading-tight line-clamp-2 uppercase font-outfit">{event.title}</h3>
        <div className="space-y-3 mt-auto">
           <div className="flex items-center gap-3 text-black/20 font-black uppercase text-[10px] tracking-widest"><Calendar size={14} />{new Date(event.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
           <div className="flex items-center gap-3 text-black/20 font-black uppercase text-[10px] tracking-widest"><MapPin size={14} />{event.location || "Online"}</div>
        </div>
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-black/[0.03]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full overflow-hidden border border-black/5">
              <img src={event.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.author?.full_name}`} className="w-full h-full object-cover" alt="" />
            </div>
            <span className="text-[9px] font-black text-black/20 uppercase">{event.author?.full_name || "Host"}</span>
          </div>
          <button 
            onClick={() => router.push(`/chat?user=${event.author?.id}`)}
            className="h-10 px-6 bg-white border border-black/[0.08] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
