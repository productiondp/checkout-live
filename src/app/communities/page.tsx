"use client";
import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Filter, 
  Users, 
  Zap, 
  ChevronRight,
  ArrowRight,
  Sparkles,
  MapPin,
  Lock,
  Globe
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Community, CommunityCategory } from "@/types/communities";
import { analytics } from "@/utils/analytics";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";
import TerminalLayout from "@/components/layout/TerminalLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [communities, setCommunities] = useState<any[]>([]);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const fetchCommunities = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          host:profiles(full_name, avatar_url, match_score)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCommunities(data || []);

      if (user) {
        const { data: mData } = await supabase
          .from('memberships')
          .select('community_id')
          .eq('user_id', user.id);
        setUserMemberships(mData?.map(m => m.community_id) || []);
      }
    } catch (err) {
      console.error("Error fetching communities:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinLeave = async (e: React.MouseEvent, communityId: string) => {
    e.stopPropagation();
    if (!user) return;

    const isJoined = userMemberships.includes(communityId);
    
    try {
      if (isJoined) {
        await supabase
          .from('memberships')
          .delete()
          .eq('community_id', communityId)
          .eq('user_id', user.id);
        setUserMemberships(prev => prev.filter(id => id !== communityId));
      } else {
        await supabase
          .from('memberships')
          .insert({ community_id: communityId, user_id: user.id });
        setUserMemberships(prev => [...prev, communityId]);
      }
    } catch (err) {
      console.error("Error joining/leaving community:", err);
    }
  };

  React.useEffect(() => {
    if (user) {
      analytics.trackScreen('COMMUNITIES', user.id);
      fetchCommunities();
    }
  }, [user]);

  if (!user) return null;

  const categories = ["All", "Hiring", "Partnership", "Leads", "Meetup", "Strategy", "Logistics", "Local"];

  const filteredCommunities = communities.filter(comm => {
    const matchesSearch = comm.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         comm.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = activeTab === "All" || comm.category === activeTab;
    if (activeTab === "Local") {
      matchesTab = comm.location === user.city;
    }
    
    return matchesSearch && matchesTab;
  });

  const featuredCommunities = communities.filter(c => c.is_featured);
  const trendingCommunities = communities.slice(0, 3);
  const localCommunities = communities.filter(c => c.location === user.city).slice(0, 3);

  return (
    <ProtectedRoute>
      <TerminalLayout
        topbarChildren={
          <div className="flex items-center gap-3 lg:gap-6 max-w-full">
             <div className="flex p-1 bg-[#F5F5F7] rounded-2xl border border-black/[0.03] overflow-x-auto no-scrollbar max-w-[200px] md:max-w-[400px] lg:max-w-none shrink">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={cn(
                      "px-4 lg:px-6 h-9 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap",
                      activeTab === cat ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black"
                    )}
                  >
                    {cat}
                  </button>
                ))}
             </div>
             <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="h-10 px-4 lg:px-6 bg-black text-white rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#E53935] transition-all shadow-lg active:scale-95 shrink-0"
              >
                <Plus size={14} /> <span className="hidden sm:inline">Create</span>
              </button>
          </div>
        }
      >
        <div className="p-8 max-w-7xl mx-auto space-y-12">
          {/* SEARCH SECTION */}
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/10" size={20} />
              <input 
                type="text" 
                placeholder="Search by community name or topic..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 bg-white border border-black/[0.03] rounded-2xl pl-16 pr-6 text-sm font-bold text-[#1D1D1F] focus:border-[#E53935]/20 outline-none transition-all shadow-sm"
              />
            </div>
            <button className="h-16 px-6 bg-white border border-black/[0.03] text-[#1D1D1F] rounded-2xl flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm shrink-0">
              <Filter size={18} />
            </button>
          </div>
  
          {/* FEATURED SECTION */}
          <section>
            <div className="flex items-center gap-3 text-[#E53935] mb-8">
              <Sparkles size={20} fill="currentColor" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20">Featured Communities</h2>
            </div>
            
            <div className="flex overflow-x-auto no-scrollbar gap-6 pb-6">
              {featuredCommunities.map((comm) => (
                <div 
                  key={comm.id}
                  onClick={() => router.push(`/communities/${comm.id}`)}
                  className="min-w-[340px] md:min-w-[420px] bg-white rounded-2xl p-8 border border-black/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="h-14 w-14 bg-[#F5F5F7] rounded-2xl flex items-center justify-center text-[#1D1D1F] group-hover:bg-[#E53935] group-hover:text-white transition-all">
                      <Users size={24} />
                    </div>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {comm.type}
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#1D1D1F] mb-4 uppercase font-outfit">{comm.name}</h3>
                  <p className="text-[13px] font-bold text-black/40 leading-relaxed mb-8 line-clamp-2 uppercase">{comm.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                    {comm.tags?.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-[#F5F5F7] text-black/20 rounded-2xl text-[8px] font-black uppercase tracking-widest">{tag}</span>
                    ))}
                  </div>
   
                  <div className="flex items-center justify-between pt-6 border-t border-black/[0.03]">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-black/10" />
                      <span className="text-[11px] font-black text-[#1D1D1F] uppercase">{comm.member_count || 0} Members</span>
                    </div>
                    <button className={cn(
                      "h-10 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                      userMemberships.includes(comm.id) ? "bg-emerald-500 text-white" : "bg-black text-white group-hover:bg-[#E53935]"
                    )}>
                      {userMemberships.includes(comm.id) ? "You're in  Chat is open" : "Join Community"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
  
          {/* MAIN LIST */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunities.map((comm) => (
                <CommunityCard 
                  key={comm.id} 
                  community={comm} 
                  isJoined={userMemberships.includes(comm.id)} 
                  onJoinLeave={(e) => handleJoinLeave(e, comm.id)}
                />
              ))}
            </div>
  
            {filteredCommunities.length === 0 && (
              <div className="py-32 text-center bg-white rounded-2xl border border-black/[0.03]">
                <div className="h-20 w-20 bg-[#F5F5F7] rounded-2xl mx-auto flex items-center justify-center text-black/10 mb-8">
                  <Globe size={32} />
                </div>
                <h3 className="text-xl font-black text-[#1D1D1F] uppercase font-outfit">No Communities Found</h3>
                <p className="text-black/20 text-[11px] font-black uppercase tracking-widest mt-2">Try adjusting your search or filters.</p>
              </div>
            )}
          </section>
  
          {/* DISCOVERY LOGIC - SMART SECTIONS */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-black/[0.03]">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20">Trending Communities</h2>
                <button className="text-[10px] font-black text-[#E53935] uppercase tracking-widest hover:underline">See All</button>
              </div>
              <div className="space-y-3">
                {trendingCommunities.map(comm => (
                  <div key={comm.id} className="p-5 bg-white border border-black/[0.03] rounded-2xl flex items-center justify-between group cursor-pointer hover:border-black/[0.08] hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-[#F5F5F7] rounded-2xl flex items-center justify-center text-[#1D1D1F] group-hover:bg-[#E53935] group-hover:text-white transition-all">
                        <Zap size={20} />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-black text-[#1D1D1F] uppercase font-outfit">{comm.name}</h4>
                        <p className="text-[9px] font-black text-black/20 uppercase tracking-widest">{comm.category}  {comm.member_count || 0} Members</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-black/10 group-hover:text-[#E53935] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
   
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20">Near {user.city}</h2>
                <button className="text-[10px] font-black text-[#E53935] uppercase tracking-widest hover:underline">See All</button>
              </div>
              <div className="space-y-3">
                {localCommunities.map(comm => (
                  <div key={comm.id} className="p-5 bg-white border border-black/[0.03] rounded-2xl flex items-center justify-between group cursor-pointer hover:border-black/[0.08] hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-[#F5F5F7] rounded-2xl flex items-center justify-center text-[#1D1D1F] group-hover:bg-[#E53935] group-hover:text-white transition-all">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-black text-[#1D1D1F] uppercase font-outfit">{comm.name}</h4>
                        <p className="text-[9px] font-black text-black/20 uppercase tracking-widest">{comm.category}  {comm.member_count || 0} Members</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-black/10 group-hover:text-[#E53935] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
  
        {isCreateModalOpen && (
          <CreateCommunityFlow onClose={() => setIsCreateModalOpen(false)} />
        )}
      </TerminalLayout>
    </ProtectedRoute>
  );
}

function CommunityCard({ community, isJoined, onJoinLeave }: { community: any, isJoined: boolean, onJoinLeave: (e: React.MouseEvent) => void }) {
  const router = useRouter();
  return (
    <div 
      onClick={() => router.push(`/communities/${community.id}`)}
      className="bg-white rounded-2xl p-8 border border-black/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-8">
        <div className="h-14 w-14 bg-[#F5F5F7] rounded-2xl flex items-center justify-center text-[#1D1D1F] group-hover:bg-[#E53935] group-hover:text-white transition-all shadow-sm">
          {community.type === 'ADVISOR_LED' ? <Sparkles size={24} /> : <Users size={24} />}
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
          community.type === "ADVISOR_LED" ? "bg-amber-50 text-amber-600" :
          community.is_private ? "bg-slate-50 text-slate-600" : "bg-emerald-50 text-emerald-600"
        )}>
          {community.type === 'ADVISOR_LED' ? "Advisor Led" : community.is_private ? "Private" : "Open"}
        </div>
      </div>
      <h3 className="text-xl font-black text-[#1D1D1F] mb-4 uppercase font-outfit">{community.name}</h3>
      <p className="text-[13px] font-bold text-black/40 leading-relaxed mb-8 line-clamp-3 uppercase">{community.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-10 mt-auto">
        {community.tags?.map((tag: string) => (
          <span key={tag} className="px-3 py-1 bg-[#F5F5F7] text-black/20 rounded-2xl text-[8px] font-black uppercase tracking-widest">{tag}</span>
        ))}
      </div>
 
      <div className="flex items-center justify-between pt-6 border-t border-black/[0.03]">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-black/10" />
          <span className="text-[11px] font-black text-[#1D1D1F] uppercase">{community.member_count || 0}</span>
        </div>
        <button 
          onClick={onJoinLeave}
          className={cn(
            "h-10 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
            isJoined ? "bg-emerald-500 text-white" : "bg-white border border-black/[0.08] text-[#1D1D1F] hover:bg-black hover:text-white"
          )}
        >
          {isJoined ? "You're in  Chat is open" : "Join Community"}
        </button>
      </div>
    </div>
  );
}

function CreateCommunityFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "", 
    category: "Hiring", 
    tags: "", 
    type: "OPEN", 
    membership_rule: "ANYONE",
    location: "Online"
  });
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const handleCreate = async () => {
    if (!user) return;
    
    // Trust Check (Disabled for Test Mode)
    /*
    if ((user.match_score || 0) < 80) {
      alert("You need a higher Trust Score (80+) to establish a new community.");
      return;
    }
    */

    setIsCreating(true);
    try {
      const slug = `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: formData.name,
          slug: slug,
          description: formData.description,
          category: formData.category,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          type: formData.type,
          membership_rule: formData.membership_rule,
          location: formData.location,
          host_id: formData.type === 'ADVISOR_LED' ? user.id : null,
          is_private: formData.type === 'PRIVATE'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Auto-join creator as Admin
      await supabase.from('memberships').insert({
        community_id: data.id,
        user_id: user.id,
        role: 'ADMIN'
      });

      onClose();
      router.push(`/communities/${data.id}`);
    } catch (err: any) {
      console.error("Error creating community:", err);
      alert(err.message || "Failed to create community. Check if name is unique.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 lg:p-10">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-4xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar border border-black/[0.05]">
        <div className="bg-black p-10 text-white relative">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Step {step} of 6</span>
            <button onClick={onClose} className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"></button>
          </div>
          <h2 className="text-3xl font-black uppercase font-outfit">Create Community</h2>
          <div className="flex gap-2 mt-8">
            {[1, 2, 3, 4, 5, 6].map(s => (
              <div key={s} className={cn("h-1 flex-1 rounded-full transition-all duration-500", s <= step ? "bg-[#E53935]" : "bg-white/10")} />
            ))}
          </div>
        </div>
        <div className="p-10">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase">What is this community about?</h3>
                  <p className="text-black/40 text-[11px] font-black uppercase tracking-widest">Give it a strong identity.</p>
               </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-black/20 ml-2">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Startup Builders Kochi" className="w-full h-16 bg-[#F5F5F7] border border-black/[0.03] rounded-2xl px-6 text-sm font-bold text-black outline-none focus:bg-white focus:border-[#E53935]/20 transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-black/20 ml-2">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the focus and goals..." className="w-full h-32 bg-[#F5F5F7] border border-black/[0.03] rounded-2xl p-6 text-sm font-bold text-black outline-none focus:bg-white focus:border-[#E53935]/20 transition-all resize-none" />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase">Select Category</h3>
                  <p className="text-black/40 text-[11px] font-black uppercase tracking-widest">Where does this group fit best?</p>
               </div>
              <div className="grid grid-cols-2 gap-3">
                {["Hiring", "Partnership", "Leads", "Meetup", "Logistics", "Strategy"].map(cat => (
                  <button key={cat} onClick={() => setFormData({...formData, category: cat})} className={cn("h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all", formData.category === cat ? "bg-black text-white shadow-xl" : "bg-[#F5F5F7] border border-black/[0.03] text-black/40 hover:text-black")}>{cat}</button>
                ))}
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-black/20 ml-2">Tags (Comma separated)</label>
                <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="e.g. Tech, Scaling, B2B" className="w-full h-16 bg-[#F5F5F7] border border-black/[0.03] rounded-2xl px-6 text-sm font-bold text-black outline-none focus:bg-white focus:border-[#E53935]/20 transition-all" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase">Community Type</h3>
                  <p className="text-black/40 text-[11px] font-black uppercase tracking-widest">Define access and management.</p>
               </div>
              <div className="space-y-4">
                {["OPEN", "PRIVATE", "ADVISOR_LED"].map(t => (
                  <div key={t} onClick={() => setFormData({...formData, type: t})} className={cn("p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group", formData.type === t ? "border-[#E53935] bg-red-50/10" : "border-black/[0.03] hover:border-black/[0.1]")}>
                    <div className="flex items-center gap-5">
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all", formData.type === t ? "bg-[#E53935] text-white" : "bg-[#F5F5F7] text-black/20")}>
                        {t === "OPEN" ? <Globe size={20} /> : t === "PRIVATE" ? <Lock size={20} /> : <Sparkles size={20} />}
                      </div>
                      <div>
                        <h4 className="text-[15px] font-black text-black uppercase font-outfit">{t.replace('_', ' ')}</h4>
                        <p className="text-[10px] font-black text-black/20 uppercase">
                          {t === "OPEN" ? "Anyone relevant can join" : t === "PRIVATE" ? "Approval required" : "Advisor managed (Premium)"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase">Membership Rules</h3>
                  <p className="text-black/40 text-[11px] font-black uppercase tracking-widest">How do users join?</p>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {["ANYONE", "APPROVAL"].map(rule => (
                    <button key={rule} onClick={() => setFormData({...formData, membership_rule: rule})} className={cn("p-8 rounded-2xl border-2 text-left transition-all", formData.membership_rule === rule ? "border-[#E53935] bg-red-50/10" : "border-black/[0.03] hover:border-black/10")}>
                      <h4 className="text-xl font-black uppercase">{rule === 'ANYONE' ? 'Instant Entry' : 'Manual Approval'}</h4>
                      <p className="text-[10px] font-black text-black/20 uppercase mt-1">{rule === 'ANYONE' ? 'Open to all verified relevant profiles' : 'Host must approve each member'}</p>
                    </button>
                  ))}
               </div>
            </div>
          )}
          {step === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase">Location Scope</h3>
                  <p className="text-black/40 text-[11px] font-black uppercase tracking-widest">Where is the primary activity?</p>
               </div>
               <div className="grid grid-cols-3 gap-3">
                  {["Online", "Kochi", "Trivandrum", "Bangalore", "Mumbai", "Global"].map(loc => (
                    <button key={loc} onClick={() => setFormData({...formData, location: loc})} className={cn("h-16 rounded-2xl text-[10px] font-black uppercase transition-all", formData.location === loc ? "bg-black text-white shadow-xl" : "bg-[#F5F5F7] border border-black/[0.03] text-black/40 hover:text-black")}>{loc}</button>
                  ))}
               </div>
            </div>
          )}
          {step === 6 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase">Review & Launch</h3>
                  <p className="text-black/40 text-[11px] font-black uppercase tracking-widest">Final check before going live.</p>
               </div>
               <div className="p-8 bg-[#F5F5F7] rounded-2xl space-y-4 border border-black/[0.03]">
                  <div className="flex justify-between border-b border-black/5 pb-4"><span className="text-[10px] font-black text-black/20 uppercase">Name</span><span className="text-[11px] font-black uppercase">{formData.name}</span></div>
                  <div className="flex justify-between border-b border-black/5 pb-4"><span className="text-[10px] font-black text-black/20 uppercase">Type</span><span className="text-[11px] font-black uppercase">{formData.type}</span></div>
                  <div className="flex justify-between border-b border-black/5 pb-4"><span className="text-[10px] font-black text-black/20 uppercase">Rule</span><span className="text-[11px] font-black uppercase">{formData.membership_rule}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] font-black text-black/20 uppercase">Location</span><span className="text-[11px] font-black uppercase">{formData.location}</span></div>
               </div>
            </div>
          )}
          <div className="flex items-center gap-4 mt-12">
            {step > 1 && <button onClick={() => setStep(s => s - 1)} className="h-16 px-10 bg-[#F5F5F7] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black/5 transition-all">Back</button>}
            <button 
              onClick={step === 6 ? handleCreate : () => setStep(s => s + 1)} 
              disabled={isCreating}
              className="flex-1 h-16 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E53935] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isCreating ? "Launching..." : step === 6 ? "Create Community" : "Next Step"} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


