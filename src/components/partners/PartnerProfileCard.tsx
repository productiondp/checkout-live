"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Zap, 
  CheckCircle2, 
  MapPin, 
  MoreHorizontal, 
  Trash2, 
  ShieldAlert, 
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import ConnectButton from "@/components/ui/ConnectButton";

export default function PartnerProfileCard({ partner, index, onAction, onSecondaryAction, actionLabel, disabled, variant, setConfirmAction, authUser }: any) {
  const router = useRouter();
  
  // 100% Fail-safe guard
  if (!partner || typeof partner !== 'object') return null;
  
  // Defensive metadata extraction
  const metadata = partner.metadata || {};
  const score = metadata.match_score || 0;
  const lastActive = metadata.last_active || "Nearby";
  const reasons = Array.isArray(metadata.reasons) ? metadata.reasons : [];

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="group relative bg-white border border-black/[0.03] rounded-2xl p-6 hover:shadow-xl hover:shadow-black/[0.02] hover:border-black/[0.08] transition-all duration-500 flex flex-col h-full">
      <div className="flex items-start gap-4 mb-8">
        <div onClick={() => router.push(`/profile/${partner.id}`)} className="h-16 w-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white shrink-0 cursor-pointer relative">
          <img src={partner.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.full_name}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
          {variant === 'connected' && <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-[#34C759] text-white rounded-2xl flex items-center justify-center border-2 border-white"><CheckCircle2 size={12} /></div>}
        </div>
        <div className="min-w-0 pt-1">
          <h4 className="text-[16px] font-black text-[#1D1D1F] truncate uppercase font-outfit mb-0.5">{partner.full_name}</h4>
          <p className="text-[10px] font-black text-[#E53935] uppercase tracking-widest">{partner.role}</p>
          <div className="flex items-center gap-1.5 mt-2 text-black/20"><MapPin size={10} strokeWidth={3} /><span className="text-[9px] font-black uppercase tracking-widest">{lastActive}</span></div>
        </div>
      </div>
      <div className="flex-1 space-y-6">
         <div className="flex flex-wrap gap-1.5">{(partner.skills || []).slice(0, 3).map((skill: string) => <span key={skill} className="px-2 py-1 bg-[#F5F5F7] text-black/40 rounded-2xl text-[8px] font-black uppercase tracking-widest border border-black/[0.02]">{skill}</span>)}</div>
         <div className="p-4 bg-slate-50/50 rounded-2xl border border-black/[0.02] space-y-3">
            <div className="flex items-center justify-between"><p className="text-[8px] font-black text-black/20 uppercase tracking-widest">Match Score</p><span className="text-4xl font-black text-[#E53935] font-outfit tracking-tighter">{score}%</span></div>
            <div className="space-y-2">{reasons.slice(0, 2).map((reason: string, i: number) => <div key={i} className="flex items-start gap-2 text-[10px] font-bold text-black/60 leading-tight"><div className="h-1 w-1 rounded-full bg-[#E53935] mt-1.5 shrink-0" />{reason}</div>)}</div>
         </div>
      </div>
      <div className="mt-8 pt-6 border-t border-black/[0.03] flex items-center gap-2">
         {onAction ? (
           <div className="flex-1 flex gap-2">
             <button 
                disabled={disabled} 
                onClick={(e) => { e.stopPropagation(); onAction(); }} 
                className={cn(
                  "flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", 
                  variant === 'connected' ? "bg-black text-white hover:bg-[#E53935]" : 
                  variant === 'outgoing' ? "bg-[#F5F5F7] text-black/40 hover:bg-red-50 hover:text-[#E53935]" :
                  disabled ? "bg-black/[0.05] text-black/20 cursor-default shadow-none" : 
                  "bg-[#E53935] text-white hover:bg-black shadow-lg shadow-red-500/10"
                )}
             >
               {actionLabel}
               {variant === 'connected' ? <MessageSquare size={14} /> : 
                variant === 'outgoing' ? <X size={14} /> :
                <Zap size={14} />}
             </button>
             {variant === 'request' && !disabled && (
               <button 
                  onClick={(e) => { e.stopPropagation(); onSecondaryAction?.(); }} 
                  className="h-12 px-4 bg-[#F5F5F7] text-black/40 hover:bg-red-50 hover:text-[#E53935] rounded-2xl text-[10px] font-black uppercase transition-all"
               >
                 Reject
               </button>
             )}
           </div>
         ) : <ConnectButton targetId={partner.id} className="flex-1" />}
         <div className="relative group/menu">
            <button className="h-12 w-12 bg-white border border-black/[0.08] rounded-2xl flex items-center justify-center text-black/30 hover:text-black transition-all"><MoreHorizontal size={16} /></button>
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-black/[0.08] rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50 p-1">
               <button onClick={async (e) => { e.stopPropagation(); const supabase = createClient(); const { data } = await supabase.from('connections').select('id').or(`and(sender_id.eq.${authUser?.id},receiver_id.eq.${partner.id}),and(sender_id.eq.${partner.id},receiver_id.eq.${authUser?.id})`).maybeSingle(); if (data) setConfirmAction({ type: 'REMOVE', connectionId: data.id, partnerName: partner.full_name }); }} className="w-full h-10 px-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#E53935] hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={12} /> Remove</button>
               <button onClick={async (e) => { e.stopPropagation(); const supabase = createClient(); const { data } = await supabase.from('connections').select('id').or(`and(sender_id.eq.${authUser?.id},receiver_id.eq.${partner.id}),and(sender_id.eq.${partner.id},receiver_id.eq.${authUser?.id})`).maybeSingle(); if (data) setConfirmAction({ type: 'BLOCK', connectionId: data.id, partnerName: partner.full_name }); }} className="w-full h-10 px-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-black hover:bg-slate-50 rounded-2xl transition-all"><ShieldAlert size={12} /> Block</button>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
