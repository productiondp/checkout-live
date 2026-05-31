"use client";

import React, { useState } from "react";
import { Send, Check, MessageSquare, Clock, UserPlus, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnections, ConnectionState } from "@/hooks/useConnections";
import { analytics } from "@/utils/analytics";
import { useRouter } from "next/navigation";

interface ConnectButtonProps {
  userId: string;
  userName?: string;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  label?: string;
}

export function ConnectButton({ userId, userName = "this user", variant = "primary", className, label }: ConnectButtonProps) {
  const { getConnectionState, sendRequest } = useConnections();
  const router = useRouter();
  const state = getConnectionState(userId);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [intent, setIntent] = useState<'IDEA' | 'DETAILS' | 'HELP' | null>(null);
  const [message, setMessage] = useState("");

  const INTENTS = [
    { id: 'IDEA', label: 'Share Idea', icon: Sparkles, defaultMsg: "Hi, Im interested in your idea. Id like to contribute and build this together." },
    { id: 'DETAILS', label: 'Ask Details', icon: MessageSquare, defaultMsg: "Hi, can you share more details about this?" },
    { id: 'HELP', label: 'Offer Help', icon: Send, defaultMsg: "Hi, I have experience in this area and can help with your project." },
  ];

  const handleIntentSelect = (id: any) => {
    const selected = INTENTS.find(i => i.id === id);
    setIntent(id);
    setMessage(selected?.defaultMsg || "");
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state === "NONE" || state === "ACCEPT_IGNORE") {
      setShowModal(true);
    } else {
      router.push(`/chat?user=${userId}`);
    }
  };

  const getButtonConfig = () => {
    switch (state) {
      case "PENDING":
        return {
          icon: Clock,
          text: "Waiting for Reply",
          class: "bg-slate-100 text-slate-400 cursor-default",
          disabled: false // Allow clicking to go to chat and see "Waiting"
        };
      case "CONNECTED":
      case "MESSAGE":
        return {
          icon: MessageSquare,
          text: "Chat",
          class: "bg-[#292828] text-white hover:bg-[#E53935]",
          disabled: false
        };
      default:
        return {
          icon: UserPlus,
          text: label || "Start Conversation",
          class: "bg-[#292828] text-white hover:bg-[#E53935]",
          disabled: false
        };
    }
  };

  const handleStart = async () => {
    if (!message.trim() || !intent) return;
    setIsSuccess(true);
    try {
      // 1. Create connection and send first message
      await sendRequest(userId, { intent, message });
      analytics.track('CONVERSATION_STARTED', { targetId: userId, intent });
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
    }
  };

  const config = getButtonConfig();

  return (
    <>
      <button 
        onClick={handleClick}
        className={cn(
          "h-12 px-8 rounded-lg font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl",
          config.class,
          className
        )}
      >
        <config.icon size={16} />
        {config.text}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-[#292828]/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-lg p-10 shadow-4xl animate-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-black uppercase text-[#292828]">Start Conversation</h2>
                 <button onClick={() => setShowModal(false)} className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center"><X size={20} /></button>
              </div>
              
              {!isSuccess ? (
                <>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">What do you want to do?</p>
                  <div className="grid grid-cols-1 gap-3 mb-8">
                    {INTENTS.map((i) => (
                      <button 
                        key={i.id}
                        onClick={() => handleIntentSelect(i.id)}
                        className={cn(
                          "flex items-center gap-4 p-5 rounded-lg border-2 transition-all text-left group",
                          intent === i.id ? "border-[#E53935] bg-red-50/10" : "border-slate-50 hover:border-slate-200 bg-slate-50"
                        )}
                      >
                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-all", intent === i.id ? "bg-[#E53935] text-white" : "bg-white text-slate-300")}>
                          <i.icon size={18} />
                        </div>
                        <div>
                          <p className="text-[12px] font-black uppercase text-[#292828]">{i.label}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Connect via {i.label.split(' ')[1]}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {intent && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <label className="text-[9px] font-black uppercase text-slate-300 ml-1">Structured Message</label>
                      <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-[#292828] outline-none focus:border-[#E53935] focus:bg-white transition-all resize-none italic"
                        rows={3}
                      />
                      <button 
                        onClick={handleStart}
                        className="w-full h-16 bg-[#E53935] text-white rounded-lg font-black text-[10px] uppercase shadow-2xl hover:bg-[#292828] transition-all flex items-center justify-center gap-3"
                      >
                        Send Intent <Send size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-10 text-center animate-in zoom-in-95 duration-500">
                  <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-lg mx-auto mb-6 flex items-center justify-center">
                    <Check size={40} strokeWidth={3} />
                  </div>
                  <h3 className="text-xl font-black text-[#292828] uppercase mb-2">Intent Sent</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed max-w-[240px] mx-auto">Conversation initiated. Youll be notified when they reply.</p>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="mt-10 w-full h-16 bg-[#292828] text-white rounded-lg font-black text-[10px] uppercase hover:bg-[#E53935] transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
           </div>
        </div>
      )}
    </>
  );
}
