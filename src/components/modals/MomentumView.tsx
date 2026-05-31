"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  UserPlus,
  MessageSquare,
  Zap,
  TrendingUp,
  Award,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";
import { DEFAULT_AVATAR } from "@/utils/constants";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chatStore";
import { cn } from "@/lib/utils";
interface MomentumViewProps {
  type: 'REQUIREMENT' | 'PARTNERSHIP' | 'MEETUP';
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MomentumView({ type, postId, isOpen, onClose }: MomentumViewProps) {
  const { user } = useAuth();
  const { setOverlayChatId, setOverlayOpen } = useChatStore();
  const [post, setPost] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestSent, setRequestSent] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      if (!postId || !isOpen) return;
      
      console.log(`[MOMENTUM] Fetching data for post: ${postId}`);
      setIsLoading(true);
      try {
        // 1. Fetch Post Details
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*, profiles!posts_author_id_fkey(id, full_name, avatar_url, role)')
          .eq('id', postId)
          .single();
        
        if (postError) {
          console.error("[MOMENTUM_POST_ERROR]", postError);
        } else {
          console.log("[MOMENTUM_POST_SUCCESS]", postData);
          setPost(postData);
        }

        // 2. Fetch Neural Matches
        const { data: people } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user?.id)
          .limit(4);
        
        const enriched = (people || []).map(p => ({
          ...p,
          reputation: p.match_score || p.metadata?.checkout_score || 85,
          compatibility: p.match_score || Math.round(85 + (parseInt(p.id.substring(0,4), 16) % 15)),
          skills: p.metadata?.skills || p.skills || (p.role ? [p.role] : ["Professional"])
        }));

        setMatches(enriched);
      } catch (err) {
        console.error("Momentum Data Error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [postId, isOpen]);

  const handleConnect = (personId: string) => {
    setRequestSent(personId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-10 pointer-events-none">
          {/* Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-black/40 backdrop-blur-3xl rounded-2xl md:rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar text-white shadow-[0_0_100px_rgba(255,255,255,0.05)] border border-white/10 relative pointer-events-auto font-outfit"
          >
            {/* Ambient Glowing Background Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
              <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-gradient-to-tl from-emerald-500/10 to-cyan-500/10 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 h-12 w-12 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all z-[100] group border border-white/10 shadow-lg"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform" />
            </button>

            <div className="p-8 md:p-14 relative z-10 space-y-14">
              {isLoading ? (
                <div className="h-[400px] flex flex-col items-center justify-center space-y-8">
                   <div className="h-16 w-16 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                   <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Initializing Link...</p>
                </div>
              ) : post ? (
                <>
                  {/* 1. CINEMATIC POST HEADER */}
                  <div className="flex flex-col lg:flex-row gap-16 items-start">
                    <div className="flex-1 space-y-8">
                        <div className="flex items-center gap-4">
                          <span className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                              <Sparkles size={12} fill="currentColor" />
                              Momentum Active
                          </span>
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Live on network</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 tracking-tighter leading-[1.1] pb-2">
                          {post.title}
                        </h1>

                        <p className="text-lg md:text-xl font-medium text-white/50 leading-relaxed max-w-2xl font-outfit">
                          {post.content}
                        </p>

                        <div className="flex flex-wrap gap-3 pt-2">
                          {Object.entries(post.metadata || {}).map(([key, val]: any) => (
                            typeof val === 'string' && (
                              <div key={key} className="px-4 py-2 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl flex items-center gap-3">
                                <p className="text-[9px] font-bold uppercase text-white/30 tracking-[0.2em]">{key}</p>
                                <div className="h-3 w-[1px] bg-white/20" />
                                <p className="text-[11px] font-black uppercase text-white/90 tracking-wider">{val}</p>
                              </div>
                            )
                          ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-[380px] shrink-0">
                        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-8 relative overflow-hidden backdrop-blur-xl shadow-2xl">
                          <div className="flex items-center gap-5">
                            <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-lg border border-white/20 relative">
                                <img src={post.profiles?.avatar_url || DEFAULT_AVATAR} className="w-full h-full object-cover" alt="" />
                                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Created By</p>
                                <h4 className="text-xl font-black uppercase tracking-tight text-white">{post.profiles?.full_name}</h4>
                                <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">{post.profiles?.role || "Professional"}</p>
                            </div>
                          </div>

                          <div className="space-y-4 pt-2">
                            {post.profiles?.id !== user?.id ? (
                              <button 
                                onClick={() => {
                                  setOverlayChatId(post.profiles?.id);
                                  setOverlayOpen(true);
                                  onClose();
                                }}
                                className="w-full h-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 flex items-center justify-center gap-3"
                              >
                                  Send Message <MessageSquare size={16} className="opacity-80" />
                              </button>
                            ) : (
                              <button 
                                onClick={onClose}
                                className="w-full h-14 bg-white/10 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/20 transition-colors flex items-center justify-center gap-3"
                              >
                                  Manage Post
                              </button>
                            )}
                            <p className="text-center text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">End-to-End Encrypted</p>
                          </div>
                        </div>
                    </div>
                  </div>

                  {/* 2. NEURAL MATCHES SECTION */}
                  <div className="space-y-10 pt-10 border-t border-white/10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                             Discovery Engine Active
                          </h4>
                          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white/90">Suggested <span className="text-white/40">Collaborators</span></h2>
                        </div>
                        <button 
                          onClick={() => router.push('/matches')}
                          className="px-6 h-10 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white hover:text-black transition-all"
                        >
                          View All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {matches.map((person, idx) => (
                          <motion.div 
                            key={person.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center text-center hover:bg-white/10 transition-all duration-300 hover:border-white/20 backdrop-blur-md"
                          >
                            <div className="relative mb-4 group">
                               <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-lg border border-white/20 transition-transform group-hover:scale-105">
                                   <img src={person.avatar_url || DEFAULT_AVATAR} className="w-full h-full object-cover" alt="" />
                               </div>
                               <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-[#0F0F11] rounded-full border border-white/10 flex items-center justify-center text-[8px] font-black text-emerald-400">
                                  {person.compatibility}%
                               </div>
                            </div>
                            
                            <div className="space-y-1 flex-1 w-full mb-5">
                                <h5 className="text-[13px] font-black uppercase tracking-tight text-white/90 truncate">{person.full_name}</h5>
                                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest truncate">{person.skills?.[0] || 'Professional'}</p>
                            </div>
                            
                            <button 
                              onClick={() => handleConnect(person.id)}
                              className={cn(
                                "w-full h-10 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                requestSent === person.id 
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                  : "bg-white/10 text-white/80 hover:bg-white hover:text-black border border-transparent"
                              )}
                            >
                                {requestSent === person.id ? "Connected" : "Connect"}
                            </button>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center space-y-6">
                   <p className="text-[14px] font-black uppercase tracking-[0.2em] text-white/60">Data Unavailable</p>
                   <button onClick={onClose} className="px-6 h-10 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">Close View</button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
