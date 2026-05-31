"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Users, 
  Plus, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  MapPin, 
  ArrowLeft,
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  Target,
  Globe,
  Lock,
  ChevronRight
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TerminalLayout from "@/components/layout/TerminalLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { cn } from "@/lib/utils";
import Link from "next/link";
import PostModal from "@/components/modals/PostModal";

export default function CommunityDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user: authUser } = useAuth();
  const supabase = createClient();

  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [meetups, setMeetups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"FEED" | "MEETUPS" | "MEMBERS">("FEED");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postModalType, setPostModalType] = useState<'REQUIREMENT' | 'PARTNERSHIP' | 'MEETUP'>('REQUIREMENT');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Community details (Check if ID is UUID, otherwise fetch by slug)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      
      let query = supabase
        .from('communities')
        .select(`
          *,
          host:profiles(id, full_name, avatar_url, match_score)
        `);
      
      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }

      const { data: commData, error: commError } = await query.single();
      
      if (commError) throw commError;
      setCommunity(commData);

      // Refresh 'id' to be the UUID for subsequent queries
      const communityId = commData.id;

      // 2. Posts in community
      const { data: postData } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(full_name, avatar_url, match_score)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });
      setPosts(postData || []);

      // 3. Meetups in community
      const { data: meetupData } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(full_name, avatar_url, match_score)
        `)
        .eq('community_id', communityId)
        .eq('type', 'MEETUP')
        .order('created_at', { ascending: false });
      setMeetups(meetupData || []);

      // 4. Members
      const { data: memberData } = await supabase
        .from('memberships')
        .select(`
          *,
          user:profiles(id, full_name, avatar_url, role, match_score)
        `)
        .eq('community_id', communityId);
      setMembers(memberData || []);

      // 5. Join Status
      if (authUser) {
        const joined = memberData?.some(m => m.user_id === authUser.id);
        setIsJoined(!!joined);
      }
    } catch (err: any) {
      console.error("Error fetching community data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id, authUser]);

  const handleJoinLeave = async () => {
    if (!authUser || !community) return;
    try {
      if (isJoined) {
        await supabase
          .from('memberships')
          .delete()
          .eq('community_id', community.id)
          .eq('user_id', authUser.id);
        setIsJoined(false);
      } else {
        await supabase
          .from('memberships')
          .insert({ community_id: community.id, user_id: authUser.id });
        setIsJoined(true);
      }
      fetchData();
    } catch (err) {
      console.error("Error toggling membership:", err);
    }
  };

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-white">
       <div className="animate-spin h-10 w-10 border-4 border-[#E53935] border-t-transparent rounded-full" />
    </div>
  );

  if (error || !community) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center space-y-4">
       <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Lock size={32} />
       </div>
       <h3 className="text-xl font-black uppercase">Community Not Found</h3>
       <p className="text-[11px] font-bold text-black/40 uppercase max-w-xs leading-relaxed">
          {error || "The community you are looking for does not exist or you do not have permission to view it."}
       </p>
       <button onClick={() => router.push('/communities')} className="px-8 h-12 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Back to Discovery</button>
    </div>
  );

  return (
    <ProtectedRoute>
      <TerminalLayout
        topbarChildren={
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="h-10 w-10 bg-[#F5F5F7] rounded-full flex items-center justify-center hover:bg-black/5 transition-all">
              <ArrowLeft size={16} />
            </button>
            <div className="h-6 w-px bg-black/5" />
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 bg-black rounded-lg flex items-center justify-center text-white shadow-xl">
                  {community.type === 'ADVISOR_LED' ? <Sparkles size={18} /> : <Users size={18} />}
               </div>
               <div>
                  <h1 className="text-[14px] font-black uppercase font-outfit">{community.name}</h1>
                  <p className="text-[9px] font-black uppercase tracking-widest text-black/20">{community.category}  {members.length} Members</p>
               </div>
            </div>
          </div>
        }
      >
        <div className="flex flex-col lg:flex-row h-full">
           {/* MAIN FEED (LEFT) */}
           <div className="flex-1 overflow-y-auto no-scrollbar border-r border-black/[0.03]">
              <div className="p-8 lg:p-12 space-y-12">
                 
                 {/* HEADER CARD */}
                 <div className="bg-white rounded-2xl border border-black/[0.03] p-10 space-y-8 shadow-sm">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                       <div className="space-y-4 max-w-2xl">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                community.type === "ADVISOR_LED" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                             )}>
                                {community.type === 'ADVISOR_LED' ? "Advisor Led" : "Community"}
                             </div>
                             {community.is_private && (
                               <div className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <Lock size={10} /> Private
                               </div>
                             )}
                          </div>
                          <h1 className="text-4xl lg:text-5xl font-black uppercase font-outfit leading-tight">{community.name}</h1>
                          <p className="text-lg font-medium text-black/60 leading-relaxed italic">"{community.description}"</p>
                       </div>
                       <div className="flex flex-col gap-3 shrink-0">
                          <button 
                            onClick={handleJoinLeave}
                            className={cn(
                              "h-14 px-10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3",
                              isJoined ? "bg-[#F5F5F7] text-black hover:bg-black hover:text-white" : "bg-black text-white hover:bg-[#E53935]"
                            )}
                          >
                             {isJoined ? "Joined Community" : "Join Community"}
                          </button>
                          <div className="flex items-center gap-2 px-6">
                             <Users size={14} className="text-black/10" />
                             <span className="text-[10px] font-black text-black/40 uppercase">{members.length} Members Enrolled</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-8 border-t border-black/5">
                       {(["FEED", "MEETUPS", "MEMBERS"] as const).map(tab => (
                         <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                              "px-6 h-11 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                              activeTab === tab ? "bg-black text-white shadow-lg" : "text-black/30 hover:bg-black/5"
                            )}
                         >
                            {tab}
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* TAB CONTENT */}
                 <div className="space-y-10">
                    {activeTab === "FEED" && (
                       <div className="space-y-8">
                          {posts.length === 0 ? (
                            <div className="py-24 text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-black/10">
                               <MessageSquare size={40} className="mx-auto text-black/10" />
                               <h3 className="text-xl font-black uppercase">No activity yet</h3>
                               <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">Be the first to start a discussion.</p>
                            </div>
                          ) : (
                            posts.map(post => (
                              <div key={post.id} className="bg-white rounded-2xl border border-black/[0.03] p-10 hover:shadow-2xl transition-all">
                                 <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                       <div className="h-12 w-12 rounded-xl overflow-hidden border border-black/5 shadow-sm">
                                          <img src={post.author?.avatar_url || `https://i.pravatar.cc/150?u=${post.author_id}`} className="w-full h-full object-cover" alt="" />
                                       </div>
                                       <div>
                                          <h4 className="text-[14px] font-bold text-black uppercase leading-none mb-1">{post.author?.full_name}</h4>
                                          <p className="text-[9px] font-black text-black/20 uppercase tracking-widest">{post.type}  {new Date(post.created_at).toLocaleDateString()}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <Target size={14} className="text-[#E53935]" />
                                       <span className="text-[10px] font-black uppercase">{post.author?.match_score || 85}%</span>
                                    </div>
                                 </div>
                                 <h3 className="text-2xl font-black uppercase mb-4 leading-tight">{post.title}</h3>
                                 <p className="text-lg font-medium text-black/60 leading-relaxed line-clamp-3 italic mb-8">"{post.content}"</p>
                                 <div className="flex items-center gap-4 pt-8 border-t border-black/5">
                                    <button className="flex-1 h-14 bg-[#F5F5F7] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Discuss</button>
                                    <button className="h-14 w-14 bg-[#F5F5F7] rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all"><Plus size={20} /></button>
                                 </div>
                              </div>
                            ))
                          )}
                       </div>
                    )}

                    {activeTab === "MEETUPS" && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {meetups.length === 0 ? (
                            <div className="col-span-2 py-24 text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-black/10">
                               <Calendar size={40} className="mx-auto text-black/10" />
                               <h3 className="text-xl font-black uppercase">No upcoming meetups</h3>
                               <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">Organize a session for this community.</p>
                            </div>
                          ) : (
                            meetups.map(m => (
                              <div key={m.id} className="bg-white rounded-2xl border border-black/[0.03] p-8 space-y-6 hover:shadow-2xl transition-all">
                                 <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-[#E53935]/5 text-[#E53935] rounded-lg flex items-center justify-center">
                                       <MapPin size={20} />
                                    </div>
                                    <div>
                                       <h4 className="text-[13px] font-black uppercase">{m.title}</h4>
                                       <p className="text-[9px] font-black text-black/20 uppercase tracking-widest">{m.location || "Online"}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center justify-between pt-6 border-t border-black/5">
                                    <div className="flex -space-x-2">
                                       {[1,2,3].map(i => (
                                         <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100" />
                                       ))}
                                    </div>
                                    <Link href={`/meetup`} className="h-10 px-4 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#E53935] transition-all flex items-center gap-2">View <ChevronRight size={12} /></Link>
                                 </div>
                              </div>
                            ))
                          )}
                       </div>
                    )}

                    {activeTab === "MEMBERS" && (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {members.map(m => (
                            <div key={m.user_id} className="bg-white rounded-2xl border border-black/[0.03] p-6 flex items-center gap-4 hover:border-[#E53935]/20 transition-all cursor-pointer">
                               <div className="h-12 w-12 rounded-xl overflow-hidden border border-black/5">
                                  <img src={m.user?.avatar_url || `https://i.pravatar.cc/150?u=${m.user_id}`} className="w-full h-full object-cover" alt="" />
                               </div>
                               <div className="min-w-0">
                                  <h4 className="text-[13px] font-bold text-black uppercase truncate">{m.user?.full_name}</h4>
                                  <p className="text-[9px] font-black text-black/20 uppercase tracking-widest">{m.role || 'Member'}</p>
                               </div>
                               {m.role === 'ADMIN' && <CheckCircle2 size={16} className="text-[#E53935] ml-auto shrink-0" />}
                            </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* SIDEBAR (RIGHT) */}
           <div className="w-full lg:w-[400px] p-8 lg:p-12 space-y-12 overflow-y-auto no-scrollbar bg-slate-50/30">
              
              {/* ACTION PANEL */}
              <div className="space-y-8">
                 <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20">Quick Actions</h2>
                 <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => { setPostModalType('REQUIREMENT'); setIsPostModalOpen(true); }}
                      className="h-16 px-6 bg-white border border-black/5 rounded-2xl flex items-center justify-between group hover:border-[#E53935]/20 hover:shadow-xl transition-all"
                    >
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white group-hover:bg-[#E53935]">
                             <Plus size={18} />
                          </div>
                          <span className="text-[11px] font-black uppercase">Post in Community</span>
                       </div>
                       <ChevronRight size={16} className="text-black/10 group-hover:translate-x-1 transition-all" />
                    </button>
                    <button 
                      onClick={() => { setPostModalType('MEETUP'); setIsPostModalOpen(true); }}
                      className="h-16 px-6 bg-white border border-black/5 rounded-2xl flex items-center justify-between group hover:border-[#E53935]/20 hover:shadow-xl transition-all"
                    >
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white group-hover:bg-[#E53935]">
                             <Calendar size={18} />
                          </div>
                          <span className="text-[11px] font-black uppercase">Host Meetup</span>
                       </div>
                       <ChevronRight size={16} className="text-black/10 group-hover:translate-x-1 transition-all" />
                    </button>
                    <button className="h-16 px-6 bg-white border border-black/5 rounded-2xl flex items-center justify-between group hover:border-[#E53935]/20 hover:shadow-xl transition-all">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white group-hover:bg-[#E53935]">
                             <Users size={18} />
                          </div>
                          <span className="text-[11px] font-black uppercase">Invite Members</span>
                       </div>
                       <ChevronRight size={16} className="text-black/10 group-hover:translate-x-1 transition-all" />
                    </button>
                 </div>
              </div>

              {/* HOST INFO */}
              {community.host && (
                 <div className="space-y-8">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20">Community Host</h2>
                    <div className="p-8 bg-white rounded-2xl border border-black/[0.03] space-y-6 shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-2xl overflow-hidden border border-black/5 shadow-sm">
                             <img src={community.host.avatar_url || `https://i.pravatar.cc/150?u=${community.host_id}`} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                             <h4 className="text-[16px] font-black uppercase leading-none mb-2">{community.host.full_name}</h4>
                             <div className="flex items-center gap-2">
                                <Sparkles size={12} className="text-[#E53935]" />
                                <span className="text-[10px] font-black uppercase text-black/40">Verified Advisor</span>
                             </div>
                          </div>
                       </div>
                       <div className="p-6 bg-[#F5F5F7] rounded-xl space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] font-black text-black/20 uppercase">Trust Score</span>
                             <span className="text-[11px] font-black text-emerald-600 uppercase">{community.host.match_score}% High</span>
                          </div>
                          <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${community.host.match_score}%` }} />
                          </div>
                       </div>
                       <button className="w-full h-14 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E53935] transition-all">Message Host</button>
                    </div>
                 </div>
              )}

              {/* STATS */}
              <div className="p-8 bg-black rounded-2xl text-white space-y-6 shadow-2xl">
                 <div className="flex items-center gap-3">
                    <Target size={20} className="text-[#E53935]" />
                    <h3 className="text-[13px] font-black uppercase">Community Vitals</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white/5 rounded-2xl">
                       <p className="text-[24px] font-black font-outfit">{posts.length}</p>
                       <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-1">Discussions</p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-2xl">
                       <p className="text-[24px] font-black font-outfit">{meetups.length}</p>
                       <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-1">Meetups</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </TerminalLayout>

      <PostModal 
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        initialFormType={postModalType}
        communityId={id}
        initialCommunity={community}
        onPostSuccess={() => fetchData()}
      />
    </ProtectedRoute>
  );
}


