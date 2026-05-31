"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Users, 
  MapPin, 
  Clock, 
  Calendar,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { MeetupService } from "@/services/meetup-service";
import { createPortal } from "react-dom";

interface MeetupPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetup: any;
  currentUserId?: string;
  onJoinSuccess: (status: string, roomId?: string) => void;
}

export default function MeetupPreviewModal({ 
  isOpen, 
  onClose, 
  meetup, 
  currentUserId,
  onJoinSuccess 
}: MeetupPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && meetup?.id && currentUserId) {
      MeetupService.getMeetupStatus(meetup.id, currentUserId).then(setStatus);
    }
  }, [isOpen, meetup?.id, currentUserId]);

  const handleAction = async () => {
    if (!currentUserId || !meetup) return;
    setIsActionLoading(true);
    
    try {
      if (meetup.metadata?.access === 'CLOSED') {
        const res = await MeetupService.requestToJoin(meetup.id, currentUserId);
        onJoinSuccess(res.status);
        if (res.status === 'REQUESTED') alert("Join request sent to host.");
      } else {
        const { roomId } = await MeetupService.joinMeetup(meetup.id, currentUserId);
        onJoinSuccess('JOINED', roomId);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "APPROVAL_REQUIRED") {
        alert("This meetup requires host approval. Request sent.");
      } else if (err.message === "MEETUP_FULL") {
        alert("This meetup has reached its maximum capacity.");
      } else {
        alert(`Failed to join: ${err.message || "Please try again."}`);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!mounted || !meetup) return null;

  const isClosed = meetup.metadata?.access === 'CLOSED';
  const isFull = status?.isFull;
  const isJoined = status?.status === 'JOINED';
  const isRequested = status?.status === 'REQUESTED';
  const isAdvisor = meetup.metadata?.meetup_type === 'ADVISOR';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-safe overflow-hidden">
          {/* OVERLAY */}
          <motion.div 
            key="overlay"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
          />

          {/* MODAL CONTAINER */}
          <motion.div 
            key="modal"
            initial={{ opacity: 0, y: 100, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full sm:max-w-xl bg-white rounded-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] z-[10000] flex flex-col"
          >
            {/* FIXED CLOSE BUTTON - Always clickable even when content scrolls */}
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 h-12 w-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-black hover:bg-white transition-all z-[10001] shadow-lg border border-black/[0.03]"
            >
              <X size={24} />
            </button>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-10 pt-16">
              <div className="space-y-8">
                {/* HEADER */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                      isAdvisor ? "bg-black text-white" : "bg-[#E53935] text-white"
                    )}>
                      {isAdvisor ? 'Advisor Meetup' : 'Peer Meetup'}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={12} /> Starts 6:00 PM
                    </span>
                  </div>
                  
                  <h2 className="text-3xl sm:text-4xl font-black text-[#1D1D1F] uppercase leading-[0.9] tracking-tight font-outfit">
                    {meetup.title}
                  </h2>
                </div>

                {/* INFO GRID */}
                <div className="grid grid-cols-2 gap-3">
                  <InfoBlock icon={Users} label="Seats Left" value={`${(status?.maxSlots || meetup.max_slots || 8) - (status?.count || 0)} spots left`} highlight />
                  <InfoBlock icon={MapPin} label="Location" value={meetup.location || "Nearby"} />
                  <InfoBlock icon={Calendar} label="Timeline" value={meetup.metadata?.timeline || "Today"} />
                  <InfoBlock icon={ShieldCheck} label="Host" value={meetup.author?.name || "Member"} />
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Info size={12} /> Session Context
                  </h4>
                  <p className="text-[15px] font-medium text-slate-500 leading-relaxed italic">
                    "{meetup.description || meetup.content || "No description provided."}"
                  </p>
                </div>

                {/* ACTION AREA */}
                <div className="pt-6 border-t border-black/[0.03] space-y-4">
                  <button 
                    onClick={handleAction}
                    disabled={isActionLoading || (isFull && !isJoined)}
                    className={cn(
                      "w-full h-18 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 group overflow-hidden relative",
                      isJoined ? "bg-emerald-600 text-white" : 
                      isRequested ? "bg-slate-100 text-slate-400" :
                      isFull ? "bg-slate-100 text-slate-300" :
                      "bg-[#E53935] text-white hover:bg-black"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">
                      {isActionLoading ? "Processing..." : 
                       isJoined ? "You're Confirmed" : 
                       isRequested ? "Awaiting Host" :
                       isFull ? "Meetup Full" : 
                       isClosed ? "Request to Join" : "Join Meetup"}
                    </span>
                    {!isActionLoading && !isJoined && !isFull && !isRequested && (
                      <ArrowRight size={20} strokeWidth={4} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                    )}
                  </button>
                  
                  {!isJoined && !isRequested && !isFull && (
                    <p className="text-center text-[10px] font-bold text-slate-300 uppercase italic">
                      "You can leave anytime before it starts"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function InfoBlock({ icon: Icon, label, value, highlight }: any) {
  return (
    <div className="p-4 bg-slate-50/50 border border-black/[0.02] rounded-2xl flex flex-col gap-1">
       <div className="flex items-center gap-2 text-slate-300">
          <Icon size={12} />
          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <p className={cn("text-[13px] font-black uppercase truncate", highlight ? "text-[#E53935]" : "text-[#1D1D1F]")}>
         {value}
       </p>
    </div>
  );
}
