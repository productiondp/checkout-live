"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Target, 
  Sparkles, 
  LayoutGrid, 
  Users, 
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_AVATAR } from "@/utils/constants";
import { createClient } from "@/utils/supabase/client";
import dynamic from "next/dynamic";
import { rankEntities, SessionContext } from "@/lib/match-engine";
import { analytics } from "@/utils/analytics";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import StartHereCard from "@/components/home/StartHereCard";
import TerminalLayout from "@/components/layout/TerminalLayout";
import RightSocialRail from "@/components/layout/RightSocialRail";
import { setCache } from "@/lib/cache";
import ActiveComposer from "@/components/home/ActiveComposer";

const DealEngine = dynamic(() => import("@/components/modals/DealEngine"), { ssr: false });
const PostModal = dynamic(() => import("@/components/modals/PostModal"), { ssr: false });
const MomentumView = dynamic(() => import("@/components/modals/MomentumView"), { ssr: false });
const Feed = dynamic(() => import("@/components/home/HomeFeed"), { ssr: false });

const SMART_FILTERS = [
  { id: 'All', label: 'All', icon: LayoutGrid },
  { id: 'REQUIREMENT', label: 'Requirements', icon: Target },
  { id: 'PARTNER', label: 'Partners', icon: Sparkles },
  { id: 'MEETUP', label: 'Meetups', icon: Users },
];

interface HomeFeedClientProps {
  initialPosts?: any[];
  initialProfile?: any;
}

export default function HomeFeedClient({ initialPosts = [], initialProfile }: HomeFeedClientProps) {
  const { profile: authUser } = useAuth();
  const router = useRouter();
  
  const [activeFilter, setActiveFilter] = useState("All");
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(initialPosts.length === 0);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPost, setEditPost] = useState<any>(null);
  const [isPostActionLoop, setIsPostActionLoop] = useState<{ active: boolean; postId: string; type: any }>({ 
    active: false, 
    postId: '', 
    type: 'REQUIREMENT' 
  });

  const [postInitialType, setPostInitialType] = useState<any>(null);
  
  const [sessionContext, setSessionContext] = useState<SessionContext>({
    recent_actions: [],
    interactions: { impressions: {}, clicks: {}, connects: {}, replies: {}, last_interaction_time: Date.now() },
    network_stats: {
      category_quality: { 'REQUIREMENT': 0.85, 'PARTNER': 0.70, 'MEETUP': 0.90 },
      trending_categories: ['MEETUP'],
      peer_group_focus: { 'REQUIREMENT': 0.1 },
      unique_users_per_category: { 'REQUIREMENT': 150, 'PARTNER': 80, 'MEETUP': 200 },
      anomaly_flags: { 'PARTNER': false }
    },
    user_trust_weight: 1.0
  });

  const lastActionTime = useRef<number>(0);
  const supabase = createClient();

  //  HYDRATION: Seed the client-side cache with server-provided data
  useEffect(() => {
    if (initialProfile && authUser?.id) {
      setCache({ type: 'profile', userId: authUser.id }, initialProfile);
    }
  }, [initialProfile, authUser?.id]);

  const trackAction = (type: 'POST' | 'CONNECT' | 'VIEW' | 'CLICK' | 'REPLY', category?: string) => {
    const cat = category?.toUpperCase() || "UNKNOWN";
    const now = Date.now();
    if (now - lastActionTime.current < 1000) return; 
    lastActionTime.current = now;
    setSessionContext(prev => {
      const newInteractions = { ...prev.interactions, last_interaction_time: now };
      if (type === 'CLICK') newInteractions.clicks[cat] = (newInteractions.clicks[cat] || 0) + 1;
      if (type === 'CONNECT') newInteractions.connects[cat] = (newInteractions.connects[cat] || 0) + 1;
      if (type === 'REPLY') newInteractions.replies[cat] = (newInteractions.replies[cat] || 0) + 1;
      return {
        ...prev,
        last_clicked_category: type === 'CLICK' ? cat : prev.last_clicked_category,
        recent_actions: [{ type, timestamp: now, category: cat }, ...prev.recent_actions.slice(0, 9)],
        interactions: newInteractions
      };
    });
  };

  const initHome = async () => {
    if (!authUser) return;
    if (posts.length === 0) setIsLoading(true);
    try {
      let { data: postsData, error: fetchErr } = await supabase.from('posts').select(`*, profiles!posts_author_id_fkey(id, full_name, avatar_url, role)`).order('created_at', { ascending: false }).limit(100);
      
      if (fetchErr) {
        console.error("[FEED_ERROR] Primary fetch failed:", fetchErr);
        // Fallback: Fetch without join to ensure posts show up even if profiles are missing
        const { data: fallbackData } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
        if (fallbackData) postsData = fallbackData as any;
      }

      if (!postsData || postsData.length === 0) {
         // Second Fallback: Just in case RLS or join logic is being too strict
         const { data: finalFallback } = await supabase.from('posts').select('*').limit(20);
         if (finalFallback) postsData = finalFallback as any;
      }
      
      const { data: connections } = await supabase.from('connections').select('*').or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`);
      const mapped = (postsData || []).filter(p => {
        const authorId = p.profiles?.id || p.author_id;
        const conn = (connections || []).find(c => (c.sender_id === authUser.id && c.receiver_id === authorId) || (c.receiver_id === authorId && c.sender_id === authUser.id));
        return conn?.status !== 'BLOCKED';
      }).map(p => {
        const author = p.profiles;
        const conn = (connections || []).find(c => (c.sender_id === authUser.id && c.receiver_id === author?.id) || (c.receiver_id === author?.id && c.sender_id === authUser.id));
        return { ...p, authorName: author?.full_name || "Anonymous", avatar: author?.avatar_url || DEFAULT_AVATAR, time: p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Just now", rank: author?.role || "Member", connectionStatus: conn ? conn.status.toLowerCase() : 'none' };
      });
      const ranked = rankEntities(authUser, mapped, sessionContext);
      setPosts(ranked);
    } catch (err) { console.error("Feed Error:", err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (authUser) {
       initHome();
       analytics.trackScreen('HOME', authUser?.id);
    }
  }, [authUser, sessionContext.recent_actions.length]);

  const filteredPosts = useMemo(() => {
    let base = posts;
    if (activeFilter !== 'All') {
      base = posts.filter(p => {
        const type = p.type?.toUpperCase();
        if (activeFilter === 'REQUIREMENT') return type === 'REQUIREMENT' || type === 'LEAD' || type === 'HIRING';
        if (activeFilter === 'PARTNER' || activeFilter === 'PARTNERSHIP') return type === 'PARTNERSHIP' || type === 'PARTNER';
        return type === activeFilter;
      });
    }
    return base;
  }, [activeFilter, posts]);

  const handleOpenPosting = async (type: any = null) => {
    if (!authUser) return;
    setEditPost(null); setPostInitialType(type); setIsPosting(true);
  };

  return (
    <ProtectedRoute>
      {!authUser ? null : (
        <TerminalLayout
          topbarChildren={
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
               {SMART_FILTERS.map(f => (
                   <button 
                     key={f.id}
                     onClick={() => { setActiveFilter(f.id); trackAction('CLICK', f.id); }}
                     className={cn(
                       "px-5 h-9 md:h-10 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all border shrink-0 whitespace-nowrap flex items-center gap-2.5",
                       activeFilter === f.id ? "bg-black text-white border-black shadow-lg" : "bg-[#F5F5F7] text-black/40 border-transparent hover:border-black/10"
                     )}
                   >
                     <f.icon size={14} className={cn(activeFilter === f.id ? "text-white" : "text-black/20")} />
                     {f.label}
                   </button>
               ))}
            </div>
          }
          rightSidebar={<RightSocialRail />}
        >
        <div className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto space-y-10 md:space-y-12">
            <StartHereCard onAction={() => handleOpenPosting()} onExplore={() => router.push('/matches')} />
            <ActiveComposer user={authUser} onPost={(type) => handleOpenPosting(type)} />
            
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] text-black/20">Discovery Stream</h3>
            </div>

            <Feed 
              posts={filteredPosts} 
              isLoading={isLoading} 
              currentUserId={authUser?.id} 
              onAction={(p) => router.push(`/chat?user=${p.author_id}`)} 
              onEdit={(p) => { setEditPost(p); setIsPosting(true); }} 
              onCreate={handleOpenPosting} 
              onDelete={async (p) => { 
                const { error } = await supabase.from('posts').delete().eq('id', p.id).eq('author_id', authUser.id); 
                if (error) { alert(error.message); return; } 
                setPosts(prev => prev.filter(post => post.id !== p.id)); 
              }} 
            />
        </div>

        <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[100]">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 5 }} 
            whileTap={{ scale: 0.9 }} 
            onClick={() => handleOpenPosting()} 
            className="h-14 w-14 md:h-16 md:w-16 bg-[#1D1D1F] text-white rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-[#E53935] transition-all duration-500 ring-1 ring-white/10 group"
          >
             <motion.div 
               animate={{ rotate: [0, 90, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="h-6 w-6 md:h-7 md:w-7 flex items-center justify-center"
             >
               <Plus size={28} strokeWidth={3} />
             </motion.div>
          </motion.button>
        </div>

          {isPosting && (
            <PostModal 
              isOpen={isPosting} 
              onClose={() => setIsPosting(false)} 
              initialFormType={postInitialType} 
              onPostSuccess={(newPost) => { 
                setIsPosting(false); 
                trackAction('POST', newPost.type);
                // Cinematic delay to ensure clean transition
                setTimeout(() => {
                  setIsPostActionLoop({ active: true, postId: newPost.id, type: newPost.type });
                  initHome(); 
                }, 300);
              }} 
              editPost={editPost} 
            />
          )}
          {isPostActionLoop.active && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto no-scrollbar py-10">
              <MomentumView 
                postId={isPostActionLoop.postId} 
                type={isPostActionLoop.type} 
                onClose={() => setIsPostActionLoop({ active: false, postId: '', type: 'REQUIREMENT' })} 
              />
            </div>
          )}
          {selectedDeal && <DealEngine isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} deal={selectedDeal} />}
        </TerminalLayout>
      )}
    </ProtectedRoute>
  );
}
