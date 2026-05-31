"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, BrainCircuit, Target, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { createClient } from '@/utils/supabase/client';

import { useAuth } from '@/hooks/useAuth';

export default function CreatorAIAgentPage() {
  const { user } = useAuth();
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadAgentData() {
      if (!user) return;

      // Fetch real AI Insights from the database
      const { data: loadedInsights } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(3);
      
      if (loadedInsights) {
        setInsights(loadedInsights);
      }
    }
    loadAgentData();
  }, [supabase]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const newMsg = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, newMsg]);
    setChatInput("");
    setIsGenerating(true);

    try {
      // In production, this calls a secure API Route that wraps OpenAI
      const response = await fetch('/api/ai/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: newMsg.content })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply || "I encountered an error." }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I am currently offline." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[#FBFBFD] min-h-screen">
      <div className="bg-black text-white px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-[0.2em]">
              <BrainCircuit size={14} /> Personal AI Agent
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">Your Copilot for Growth.</h1>
            <p className="text-white/60 font-medium max-w-xl">I continuously analyze your portfolio, local market demand, and pricing to help you win more high-paying clients.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8">
        {/* Left Column: Proactive DB Insights */}
        <div className="w-full lg:w-1/3 space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight">Proactive Insights</h2>
          
          {insights.length === 0 ? (
            <p className="text-sm font-medium text-black/40">No new insights generated yet.</p>
          ) : (
            insights.map((insight, i) => (
              <div key={insight.id} className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <div className="flex items-start gap-3">
                  <Target size={20} className="text-blue-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-sm">{insight.type.replace('_', ' ')}</h3>
                    <p className="text-xs text-black/60 font-medium mt-1 leading-relaxed">
                      {insight.content.message || JSON.stringify(insight.content)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Active Chat Interface connected to API */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm h-[600px] flex flex-col">
            <div className="p-6 border-b border-black/5 flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tight text-xl flex items-center gap-2"><Sparkles size={20} className="text-blue-500" /> Checkout AI</h3>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#FBFBFD]">
               {messages.map((msg, i) => (
                 <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                   <div className={`h-10 w-10 rounded-full shrink-0 flex items-center justify-center text-white ${msg.role === 'user' ? 'bg-black/10' : 'bg-blue-500 shadow-lg shadow-blue-500/20'}`}>
                     {msg.role === 'ai' && <BrainCircuit size={18} />}
                   </div>
                   <div className={`${msg.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white border border-black/5 text-black rounded-tl-none'} p-5 rounded-2xl max-w-lg shadow-sm space-y-3`}>
                     <p className="text-sm font-medium">{msg.content}</p>
                   </div>
                 </div>
               ))}
               {isGenerating && (
                 <div className="flex gap-4">
                   <div className="h-10 w-10 bg-blue-500 rounded-full shrink-0 flex items-center justify-center text-white"><Loader2 size={18} className="animate-spin" /></div>
                   <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-black/5 max-w-lg shadow-sm"><p className="text-sm font-medium animate-pulse">Thinking...</p></div>
                 </div>
               )}
            </div>
            
            <div className="p-4 border-t border-black/5 bg-white rounded-2xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ask me to review your portfolio or find opportunities..." 
                  className="w-full bg-[#FBFBFD] border border-black/10 rounded-2xl py-4 pl-4 pr-14 text-sm font-medium focus:border-black focus:outline-none transition-all"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-[#E53935] transition-colors">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
