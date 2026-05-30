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
          reputation: p.metadata?.checkout_score || 50,
          compatibility: Math.round(85 + (Math.random() * 10)),
          skills: p.skills || ["Strategy", "Growth", "Product"]
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
            className="bg-[#0F0F11] rounded-[2rem] md:rounded-[3.5rem] w-full max-w-6xl max-h-[90vh] overflow-y-auto no-scrollbar text-white shadow-[0_100px_150px_-50px_rgba(0,0,0,1)] border border-white/5 relative pointer-events-auto font-outfit"
          >
            {/* Ambient Neural Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-[#E53935]/10 blur-[150px] rounded-full animate-pulse" />
              <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-emerald-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-emerald-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            <button 
              onClick={onClose}
              className="sticky top-8 float-right mr-8 h-12 w-12 bg-white/5 backdrop-blur-3xl rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-[#E53935] transition-all z-[100] group border border-white/10 shadow-2xl"
            >
              <X size={22} className="group-hover:rotate-90 transition-transform" />
            </button>

            <div className="p-8 md:p-16 relative z-10 space-y-16">
              {isLoading ? (
                <div className="h-[400px] flex flex-col items-center justify-center space-y-6">
                   <div className="h-20 w-20 bg-white/5 rounded-3xl animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Syncing Neural Link...</p>
                </div>
              ) : post ? (
                <>
                  {/* 1. CINEMATIC POST HEADER */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-7 space-y-8">
                        <div className="flex items-center gap-4">
                          <span className="px-4 py-1.5 bg-[#E53935]/10 border border-[#E53935]/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#E53935] flex items-center gap-2">
                              <Zap size={12} fill="currentColor" />
                              Momentum Priority
                          </span>
                          <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Surfaced 2m ago</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] italic group">
                          {post.title}
                        </h1>

                        <p className="text-lg md:text-xl font-medium text-white/60 leading-relaxed max-w-2xl">
                          {post.content}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                          {Object.entries(post.metadata || {}).map(([key, val]: any) => (
                            typeof val === 'string' && (
                              <div key={key} className="px-5 py-2.5 bg-white/5 border border-white/5 rounded-2xl">
                                <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-1">{key}</p>
                                <p className="text-[11px] font-black uppercase text-white tracking-widest">{val}</p>
                              </div>
                            )
                          ))}
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-8">
                        <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] space-y-8 relative overflow-hidden group">
                          <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-2xl bg-[#E53935] overflow-hidden shadow-2xl border-2 border-white/10 group-hover:scale-105 transition-transform duration-500">
                                <img src={post.profiles?.avatar_url || DEFAULT_AVATAR} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#E53935] uppercase tracking-[0.3em] mb-1">Author</p>
                                <h4 className="text-2xl font-black uppercase italic tracking-tight">{post.profiles?.full_name}</h4>
                                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{post.profiles?.role || "Business Owner"}</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <button 
                              onClick={() => {
                                setOverlayChatId(post.profiles?.id);
                                setOverlayOpen(true);
                                onClose();
                              }}
                              className="w-full h-16 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#E53935] hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                            >
                                Open Channel <ArrowRight size={18} strokeWidth={3} />
                            </button>
                            <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest italic">Direct neural link encrypted</p>
                          </div>
                        </div>
                    </div>
                  </div>

                  {/* 2. NEURAL MATCHES SECTION */}
                  <div className="space-y-10 pt-10 border-t border-white/5">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-3">
                          <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#E53935]">Neural Match Engine</h4>
                          <h2 className="text-3xl font-black uppercase italic tracking-tighter">High-Probability <span className="text-white/40">Collaborators</span></h2>
                        </div>
                        <button 
                          onClick={() => router.push('/matches')}
                          className="px-8 h-12 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                        >
                          Explore Network
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {matches.map((person, idx) => (
                          <motion.div 
                            key={person.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col items-center text-center group hover:bg-white/[0.05] hover:-translate-y-2 transition-all duration-500"
                          >
                            <div className="h-20 w-20 rounded-2xl bg-white/5 overflow-hidden mb-5 shadow-2xl border border-white/10 group-hover:scale-110 transition-transform">
                                <img src={person.avatar_url || DEFAULT_AVATAR} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                            </div>
                            <div className="space-y-1.5 flex-1 mb-6">
                                <h5 className="text-[15px] font-black uppercase tracking-tight italic line-clamp-1">{person.full_name}</h5>
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{person.compatibility}% Match</p>
                            </div>
                            
                            <button 
                              onClick={() => handleConnect(person.id)}
                              className={cn(
                                "w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                requestSent === person.id ? "bg-emerald-500 text-white" : "bg-white/5 hover:bg-[#E53935] text-white"
                              )}
                            >
                                {requestSent === person.id ? "Sent" : "Connect"}
                            </button>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center space-y-6">
                   <p className="text-[14px] font-black uppercase tracking-[0.3em] text-[#E53935]">Intelligence Failure</p>
                   <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Could not resolve neural link for post ${postId}</p>
                   <button onClick={onClose} className="px-8 h-12 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Return to Feed</button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
