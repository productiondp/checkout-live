"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Send, 
  Plus, 
  MoreVertical, 
  Image as ImageIcon, 
  Mic, 
  Check, 
  CheckCheck,
  ChevronLeft,
  Info,
  Clock,
  RefreshCw,
  Trash2,
  UserX,
  Flag,
  Shield,
  FileText,
  Layout,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { ChatService } from '@/services/chatService';
import { useNotifications } from "@/contexts/NotificationContext";
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import TerminalLayout from '@/components/layout/TerminalLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { createClient } from '@/utils/supabase/client';

export default function ChatPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const { 
    conversations, 
    messages, 
    activeId, 
    setActiveId, 
    addMessage, 
    setMessages, 
    setConversations,
    typing,
    isLoading 
  } = useChatStore();

  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('user');

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setActiveChatId, refreshCounts } = useNotifications();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => 
      c.title?.toLowerCase().includes(q) || 
      c.last_message_content?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const handleClearHistory = async () => {
    if (!activeId) return;
    if (confirm("Are you sure you want to clear all messages in this chat?")) {
      const { error } = await supabase.from('messages').delete().eq('connection_id', activeId);
      if (error) alert(error.message);
      else {
        setMessages(activeId, []);
        setIsSettingsOpen(false);
      }
    }
  };

  const handleDeleteChat = async () => {
    if (!activeId || !user) return;
    if (confirm("Delete this conversation?")) {
      // For V1 Schema, deleting conversation means deleting the connection
      const { error } = await supabase.from('connections').delete().eq('id', activeId);
      if (error) alert(error.message);
      else {
        setActiveId(null);
        setIsSettingsOpen(false);
        window.location.reload();
      }
    }
  };

  const activeMessages = useMemo(() => 
    activeId ? (messages[activeId] || []) : []
  , [activeId, messages]);

  const activeConvo = useMemo(() => 
    conversations.find(c => c.id === activeId)
  , [activeId, conversations]);

  const activeTyping = useMemo(() => 
    activeId ? (typing[activeId] || []) : []
  , [activeId, typing]);

  // Handle URL user parameter
  useEffect(() => {
    if (initialUserId && user?.id) {
      ChatService.ensureDirectConversation(user.id, initialUserId)
        .then((conn) => {
          if (conn && conn.id) {
            setActiveId(conn.id);
            // Re-fetch conversations to immediately show this user in the sidebar
            ChatService.getConversations(user.id).then(setConversations);
          }
        })
        .catch((err) => {
          console.error("Failed to init chat from URL:", err);
        });
    }
  }, [initialUserId, user?.id, setActiveId, setConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeId) return;
    
    const loadMessages = async () => {
      if (messages[activeId]) return; // Already loaded
      const msgs = await ChatService.getMessages(activeId);
      setMessages(activeId, msgs);
    };

    loadMessages();
    if (activeId && user?.id) {
      ChatService.markAsRead(activeId, user.id);
      setActiveChatId(activeId);
      refreshCounts();
    } else {
      setActiveChatId(null);
    }

    return () => {
      setActiveChatId(null);
    };
  }, [activeId, user?.id, setMessages, activeMessages, setActiveChatId, refreshCounts]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSend = async () => {
    if (!input.trim() || !activeId || !user || isSending) return;

    setIsSending(true);
    const content = input.trim();
    setInput("");

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversation_id: activeId,
      sender_id: user.id,
      content,
      type: 'TEXT' as const,
      created_at: new Date().toISOString(),
      metadata: { tempId }
    };
    addMessage(activeId, optimisticMsg);

    try {
      await ChatService.sendMessage(activeId, user.id, content, 'TEXT', { tempId });
      ChatService.setTypingStatus(activeId, user.id, false);
    } catch (err) {
      console.error("Send Error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (val: string) => {
    setInput(val);
    if (!activeId || !user) return;
    
    // Simple debounce/throttle would be better for prod
    if (val.length > 0) {
      ChatService.setTypingStatus(activeId, user.id, true);
    } else {
      ChatService.setTypingStatus(activeId, user.id, false);
    }
  };

  return (
    <ProtectedRoute>
      <TerminalLayout>
        <div className="flex h-[calc(100vh-64px)] bg-[#F5F5F7] overflow-hidden">
          
          {/* 1. SIDEBAR: Conversation List */}
          <div className={cn(
            "w-full md:w-80 border-r border-black/[0.03] bg-white flex flex-col transition-all",
            !isSidebarOpen && "md:w-20"
          )}>
            <div className="p-6 border-b border-black/[0.03] flex items-center justify-between">
              {isSidebarOpen && <h2 className="text-[14px] font-black uppercase tracking-widest">Messages</h2>}
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    if (!user) return;
                    console.log("[Chat] Manual sync triggered...");
                    await ChatService.syncLegacyConnections(user.id);
                    window.location.reload();
                  }}
                  className="p-2 hover:bg-[#F5F5F7] rounded-full text-black/20 hover:text-black transition-all"
                  title="Force Sync Inbox"
                >
                  <RefreshCw size={16} />
                </button>
                <button className="p-2 hover:bg-[#F5F5F7] rounded-full"><Plus size={18}/></button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={14} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isSidebarOpen ? "Search..." : ""}
                  className="w-full h-10 bg-[#F5F5F7] rounded-2xl pl-9 pr-3 text-[10px] font-black uppercase tracking-widest placeholder:text-black/20 border-none outline-none transition-all focus:bg-black/5"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => {
                      setActiveId(convo.id);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full p-4 flex items-center gap-4 transition-all hover:bg-[#F5F5F7]",
                      activeId === convo.id && "bg-[#F5F5F7]"
                    )}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {convo.avatar_url ? (
                        <img src={convo.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-black">{convo.title?.[0]}</span>
                      )}
                    </div>
                    {isSidebarOpen && (
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-black truncate">{convo.title || "Group Chat"}</span>
                          <span className="text-[9px] font-bold text-black/20">{new Date(convo.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[10px] font-bold text-black/40 truncate">
                          {convo.last_message_content || "No messages yet"}
                        </p>
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center opacity-20">
                  <p className="text-[10px] font-black uppercase tracking-widest">No results found</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. MAIN: Message Thread */}
          <div className="flex-1 flex flex-col bg-white">
            {activeConvo ? (
              <>
                {/* Header */}
                <div className="h-20 border-b border-black/[0.03] px-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-[#F5F5F7] rounded-full mr-2"><ChevronLeft size={20}/></button>
                    <div className="w-10 h-10 rounded-2xl bg-black/5 overflow-hidden">
                       <img src={activeConvo.avatar_url || "/default-avatar.png"} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-black uppercase tracking-widest">{activeConvo.title || "Group Chat"}</h3>
                      {activeTyping.length > 0 && <p className="text-[9px] font-black text-[#E53935] uppercase tracking-widest animate-pulse">Typing...</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <button 
                      onClick={() => setIsInfoOpen(!isInfoOpen)}
                      className={cn(
                        "p-3 rounded-full transition-all",
                        isInfoOpen ? "bg-black text-white" : "hover:bg-[#F5F5F7] text-black/40"
                      )}
                    >
                      <Info size={20}/>
                    </button>
                    
                    <div className="relative">
                      <button 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={cn(
                          "p-3 rounded-full transition-all",
                          isSettingsOpen ? "bg-black text-white" : "hover:bg-[#F5F5F7] text-black/40"
                        )}
                      >
                        <MoreVertical size={20}/>
                      </button>

                      <AnimatePresence>
                        {isSettingsOpen && (
                          <>
                            <div className="fixed inset-0 z-[90]" onClick={() => setIsSettingsOpen(false)} />
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/[0.03] overflow-hidden z-[100]"
                            >
                              <div className="p-2 space-y-1">
                                <button 
                                  onClick={handleClearHistory}
                                  className="w-full p-3 flex items-center gap-3 hover:bg-[#F5F5F7] rounded-xl text-[11px] font-black uppercase tracking-widest text-black/60 transition-all"
                                >
                                  <RefreshCw size={14} />
                                  Clear History
                                </button>
                                <button 
                                  onClick={handleDeleteChat}
                                  className="w-full p-3 flex items-center gap-3 hover:bg-[#F5F5F7] rounded-xl text-[11px] font-black uppercase tracking-widest text-[#E53935] transition-all"
                                >
                                  <Trash2 size={14} />
                                  Delete Conversation
                                </button>
                                <div className="h-px bg-black/[0.03] my-1" />
                                <button className="w-full p-3 flex items-center gap-3 hover:bg-[#F5F5F7] rounded-xl text-[11px] font-black uppercase tracking-widest text-black/60 transition-all">
                                  <UserX size={14} />
                                  Block User
                                </button>
                                <button className="w-full p-3 flex items-center gap-3 hover:bg-[#F5F5F7] rounded-xl text-[11px] font-black uppercase tracking-widest text-black/60 transition-all">
                                  <Flag size={14} />
                                  Report
                                </button>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
                >
                  <AnimatePresence mode="popLayout">
                    {activeMessages.map((msg, i) => {
                      const isMe = msg.sender_id === user?.id;
                      const stableKey = msg.metadata?.tempId || msg.id;
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={stableKey}
                          className={cn(
                            "flex flex-col max-w-[80%] md:max-w-[60%]",
                            isMe ? "ml-auto items-end" : "mr-auto items-start"
                          )}
                        >
                          <div className={cn(
                            "p-4 rounded-2xl text-[13px] font-medium leading-relaxed",
                            isMe ? "bg-black text-white" : "bg-[#F5F5F7] text-black"
                          )}>
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-2 mt-2 px-1">
                            <span className="text-[9px] font-black uppercase text-black/20">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && (
                              activeConvo.members?.some((m: any) => m.user_id !== user?.id && m.last_read_at && new Date(m.last_read_at) >= new Date(msg.created_at)) ? (
                                <CheckCheck size={12} className="text-blue-500" />
                              ) : (
                                <Check size={12} className="text-black/20" />
                              )
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-black/[0.03]">
                  <div className="flex items-center gap-4 bg-[#F5F5F7] p-2 rounded-2xl">
                    <button className="p-3 hover:bg-black/5 rounded-2xl text-black/20"><ImageIcon size={20}/></button>
                    <button className="p-3 hover:bg-black/5 rounded-2xl text-black/20"><Mic size={20}/></button>
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent border-none outline-none text-[12px] font-medium py-2"
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="p-3 bg-black text-white rounded-2xl disabled:opacity-20 transition-all hover:scale-105 active:scale-95"
                    >
                      <Send size={20}/>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20">
                <div className="w-20 h-20 bg-black/5 rounded-2xl flex items-center justify-center mb-6">
                  <Clock size={40}/>
                </div>
                <h3 className="text-[16px] font-black uppercase tracking-widest mb-2">Checkout Messaging</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest max-w-xs">Select a conversation from the sidebar to start collaborating.</p>
              </div>
            )}
          </div>
          
          {/* 3. INFO SIDEBAR: Conversation Details */}
          <AnimatePresence>
            {isInfoOpen && activeConvo && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-black/[0.03] bg-white flex flex-col overflow-hidden h-full relative"
              >
                <div className="p-6 border-b border-black/[0.03] flex items-center justify-between shrink-0">
                  <h2 className="text-[14px] font-black uppercase tracking-widest">Details</h2>
                  <button onClick={() => setIsInfoOpen(false)} className="p-2 hover:bg-[#F5F5F7] rounded-full text-black/20"><X size={18}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                  {/* Profile Header */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-2xl bg-black/5 overflow-hidden mb-4 border-4 border-white shadow-xl">
                      <img src={activeConvo.avatar_url || "/default-avatar.png"} alt="" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-[16px] font-black uppercase tracking-widest">{activeConvo.title || "Partner"}</h3>
                    <p className="text-[10px] font-bold text-[#E53935] uppercase tracking-[0.2em] mt-2">Active Connection</p>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex flex-col items-center justify-center p-4 bg-[#F5F5F7] rounded-2xl gap-2 hover:bg-black hover:text-white transition-all group">
                      <Shield size={18} className="text-black/20 group-hover:text-white" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Verify</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 bg-[#F5F5F7] rounded-2xl gap-2 hover:bg-black hover:text-white transition-all group">
                      <FileText size={18} className="text-black/20 group-hover:text-white" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Files</span>
                    </button>
                  </div>

                  {/* Shared Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Layout size={16} className="text-black/20" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40">Shared Context</h4>
                    </div>
                    <div className="p-5 bg-[#F5F5F7] rounded-2xl border border-black/[0.02]">
                       <p className="text-[11px] font-medium leading-relaxed text-black/60 italic uppercase tracking-tight">
                         "Building high-density network activity identified across the city. Collaborating on mission-critical requirements."
                       </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-black/[0.03]">
                  <button 
                    onClick={handleDeleteChat}
                    className="w-full py-4 border border-[#E53935]/20 text-[#E53935] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E53935] hover:text-white transition-all"
                  >
                    Close Conversation
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TerminalLayout>
    </ProtectedRoute>
  );
}
