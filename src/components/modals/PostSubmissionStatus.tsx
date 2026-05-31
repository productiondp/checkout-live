"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  X, 
  RotateCcw, 
  ShieldCheck,
  Zap,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SubmissionState = 'PREPARING' | 'POSTING' | 'RETRYING' | 'SUCCESS' | 'FAILED';

interface PostSubmissionStatusProps {
  state: SubmissionState;
  onRetry: () => void;
  onCancel: () => void;
}

const STATE_CONFIG = {
  PREPARING: {
    label: "Preparing post...",
    icon: Sparkles,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    description: "Getting everything ready"
  },
  POSTING: {
    label: "Posting...",
    icon: Loader2,
    color: "text-black",
    bg: "bg-slate-50",
    description: "Sending your post to the feed",
    animate: true
  },
  RETRYING: {
    label: "Retrying almost there",
    icon: RotateCcw,
    color: "text-amber-500",
    bg: "bg-amber-50",
    description: "Hang tight, trying again",
    animate: true
  },
  SUCCESS: {
    label: "Your partner post is live",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    description: "Visible to matching profiles now"
  },
  FAILED: {
    label: "We couldnt post",
    icon: AlertCircle,
    color: "text-[#E53935]",
    bg: "bg-red-50",
    description: "Your draft is  (saved safely)"
  }
};

export default function PostSubmissionStatus({ state, onRetry, onCancel }: PostSubmissionStatusProps) {
  const config = STATE_CONFIG[state];
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[1100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center"
    >
      <div className="w-full max-w-sm space-y-8">
        
        {/* ICON HERO */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={state}
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.5, opacity: 0, rotate: 20 }}
              className={cn(
                "h-24 w-24 mx-auto rounded-2xl flex items-center justify-center shadow-2xl relative z-10",
                config.bg,
                config.color
              )}
            >
              <Icon 
                size={40} 
                className={cn(
                  config.animate && "animate-spin",
                  state === 'SUCCESS' && "animate-in zoom-in duration-500"
                )} 
              />
            </motion.div>
          </AnimatePresence>

          {/* DECORATIVE ELEMENTS FOR SUCCESS */}
          {state === 'SUCCESS' && (
            <>
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-emerald-200 rounded-full blur-3xl -z-10"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-4 -right-4 h-10 w-10 bg-[#34C759] text-white rounded-full flex items-center justify-center shadow-lg"
              >
                <Zap size={18} className="fill-white" />
              </motion.div>
            </>
          )}
        </div>

        {/* TEXT CONTENT */}
        <div className="space-y-3">
          <motion.h2 
            key={`title-${state}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
              "text-3xl font-black italic uppercase tracking-tight",
              config.color
            )}
          >
            {config.label}
          </motion.h2>
          <motion.p 
            key={`desc-${state}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[12px] font-bold text-slate-400 uppercase tracking-widest"
          >
            {config.description}
          </motion.p>
        </div>

        {/* PERSISTENCE SIGNAL FOR SUCCESS */}
        <AnimatePresence>
          {state === 'SUCCESS' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 text-emerald-600/60"
            >
              <ShieldCheck size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Saved securely</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACTIONS */}
        <div className="pt-8 flex flex-col gap-3">
          {state === 'FAILED' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetry}
              className="h-16 w-full bg-black text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
            >
              <RotateCcw size={18} />
              Retry Submission
            </motion.button>
          )}

          {(state === 'FAILED' || state === 'POSTING' || state === 'RETRYING') && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              className="h-16 w-full bg-white border border-black/[0.05] text-slate-400 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
            >
              <X size={18} />
              Cancel
            </motion.button>
          )}
        </div>

      </div>
    </motion.div>
  );
}
