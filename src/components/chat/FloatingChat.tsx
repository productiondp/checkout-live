"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Maximize2, Send, MessageSquare, Zap, Clock } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function FloatingChat() {
  const { isOverlayOpen, overlayChatId, setOverlayOpen, setOverlayChatId, messages, addMessage, setMessages } = useChatStore();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [recipient, setRecipient] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const activeMessages = overlayChatId ? (messages[overlayChatId] || []) : [];

  useEffect(() => {
    if (!overlayChatId) return;

    async function fetchChatData() {
      // 1. Fetch recipient info
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('id', overlayChatId)
        .single();
      
      setRecipient(profile);

      // 2. Fetch recent messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${overlayChatId}),and(sender_id.eq.${overlayChatId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (msgs) setMessages(overlayChatId, msgs);
    }

    fetchChatData();

    // Subscribe to new messages
    const channel = supabase
      .channel(`floating_chat_${overlayChatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === overlayChatId || msg.receiver_id === overlayChatId) {
           addMessage(overlayChatId, msg);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [overlayChatId, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, isMinimized]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || !user || !overlayChatId) return;

    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      sender_id: user.id,
      receiver_id: overlayChatId,
      created_at: new Date().toISOString(),
      type: 'TEXT' as const
    };

    setContent("");
    addMessage(overlayChatId, tempMsg);

    const { error } = await supabase.from('messages').insert({
      content: tempMsg.content,
      sender_id: user.id,
      receiver_id: overlayChatId,
      type: 'TEXT'
    });

    if (error) console.error("Send Error:", error);
  };

  if (!isOverlayOpen || !overlayChatId) return null;

  return (
    <div className="fixed bottom-0 right-8 z-[9999] pointer-events-none flex flex-col items-end">
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="w-[360px] h-[500px] bg-white rounded-t-[2.5rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.15)] border-x border-t border-black/[0.05] flex flex-col pointer-events-auto overflow-hidden"
          >
            {/* HEADER */}
            <div className="bg-[#1D1D1F] p-5 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full border-2 border-white/10 overflow-hidden bg-white/5">
                     <img src={recipient?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${recipient?.full_name}`} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div>
                     <h4 className="text-[13px] font-black text-white uppercase tracking-tight">{recipient?.full_name || "Neural Link..."}</h4>
                     <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Active Now</p>
                  </div>
               </div>
               <div className="flex items-center gap-1">
                  <button onClick={() => setIsMinimized(true)} className="h-8 w-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all">
                     <Minus size={18} />
                  </button>
                  <button onClick={() => { setOverlayOpen(false); setOverlayChatId(null); }} className="h-8 w-8 rounded-full flex items-center justify-center text-white/40 hover:text-[#E53935] hover:bg-red-500/10 transition-all">
                     <X size={18} />
                  </button>
               </div>
            </div>

            {/* MESSAGES */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4 bg-[#FBFBFD]">
               {activeMessages.map((msg, i) => {
                 const isMe = msg.sender_id === user?.id;
                 return (
                   <motion.div 
                    initial={{ opacity: 0, x: isMe ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={msg.id} 
                    className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
                   >
                      <div className={cn(
                        "p-3.5 rounded-[1.5rem] text-[13px] font-medium leading-relaxed shadow-sm",
                        isMe ? "bg-[#1D1D1F] text-white rounded-tr-none" : "bg-white border border-black/[0.03] text-black rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[8px] font-bold text-black/20 uppercase tracking-widest mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </motion.div>
                 );
               })}
               {activeMessages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-20">
                    <Zap size={32} className="mb-4 text-[#E53935]" fill="currentColor" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Encrypted Neural Link Active</p>
                 </div>
               )}
            </div>

            {/* INPUT */}
            <div className="p-4 bg-white border-t border-black/[0.03] shrink-0">
               <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    type="text" 
                    placeholder="Type a message..." 
                    className="w-full h-12 bg-[#F5F5F7] border-none rounded-2xl pl-5 pr-14 text-[13px] font-bold text-black focus:ring-2 focus:ring-[#E53935]/10 transition-all outline-none"
                  />
                  <button 
                    type="submit"
                    className="absolute right-1 h-10 w-10 bg-[#1D1D1F] text-white rounded-xl flex items-center justify-center hover:bg-[#E53935] transition-all shadow-lg active:scale-90"
                  >
                     <Send size={18} strokeWidth={2.5} />
                  </button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MINIMIZED HEAD */}
      <motion.div 
        layout
        onClick={() => setIsMinimized(false)}
        className={cn(
          "h-16 w-16 bg-[#1D1D1F] rounded-full shadow-4xl flex items-center justify-center cursor-pointer pointer-events-auto border-2 border-white group relative",
          !isMinimized && "mt-4 mb-4 scale-0 opacity-0 hidden"
        )}
      >
        <img src={recipient?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${recipient?.full_name}`} className="h-full w-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all" alt="" />
        <div className="absolute -top-1 -right-1 h-5 w-5 bg-[#E53935] rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
           1
        </div>
      </motion.div>
    </div>
  );
}
