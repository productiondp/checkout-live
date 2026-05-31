"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ShieldCheck,
  Zap,
  Sparkles,
  Lock,
  UserCheck,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthSubmissionState = 'INITIALIZING' | 'SECURING' | 'VERIFYING' | 'SYNCING' | 'SUCCESS' | 'FAILED';

interface AuthSubmissionStatusProps {
  state: AuthSubmissionState;
  error?: string | null;
  onRetry: () => void;
}

const STATE_CONFIG = {
  INITIALIZING: {
    label: "Building Network",
    icon: Globe,
    color: "text-blue-500",
    bg: "bg-blue-50",
    description: "Calibrating your discovery stream"
  },
  SECURING: {
    label: "Securing Credentials",
    icon: Lock,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    description: "Encrypting your data for transit"
  },
  VERIFYING: {
    label: "Verifying Identity",
    icon: ShieldCheck,
    color: "text-[#E53935]",
    bg: "bg-red-50",
    description: "Connecting to the secure network"
  },
  SYNCING: {
    label: "Syncing Workspace",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-50",
    description: "Building your professional profile"
  },
  SUCCESS: {
    label: "Welcome to the Network",
    icon: UserCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    description: "Your session is verified and live"
  },
  FAILED: {
    label: "Authentication Failed",
    icon: AlertCircle,
    color: "text-[#E53935]",
    bg: "bg-red-50",
    description: "We couldn't verify your credentials"
  }
};

export default function AuthSubmissionStatus({ state, error, onRetry }: AuthSubmissionStatusProps) {
  const config = STATE_CONFIG[state];
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-[#FDFDFF] flex flex-col items-center justify-center p-6 text-center overflow-hidden font-outfit"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className={cn("absolute -top-1/4 -right-1/4 w-[100vw] h-[100vw] rounded-full blur-[120px]", config.bg.replace('bg-', 'bg-').replace('50', '500'))}
        />
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-14 relative z-10">
        
        {/* HERO: ORBITAL LOADER */}
        <div className="relative h-56 w-56 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={state}
              initial={{ scale: 0.8, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.1, opacity: 0, rotate: 15 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Outer Pulsing Glow */}
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className={cn("absolute inset-4 rounded-full blur-[40px]", state === 'FAILED' ? "bg-red-500/20" : state === 'SUCCESS' ? "bg-emerald-500/20" : "bg-[#E53935]/15")}
              />
              
              {/* Main Visual Container */}
              <div className="relative h-36 w-36 rounded-2xl bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] flex items-center justify-center border border-black/[0.03] overflow-hidden group">
                <div className={cn("absolute inset-0 opacity-[0.03]", config.bg.replace('50', '500'))} />
                
                {/* Orbital Rings */}
                {state !== 'SUCCESS' && state !== 'FAILED' && (
                  <div className="absolute inset-0 p-4">
                    <svg className="w-full h-full animate-[spin_4s_linear_infinite]">
                      <circle cx="50%" cy="50%" r="48%" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 8" className={cn(config.color, "opacity-20")} />
                    </svg>
                    <svg className="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite_reverse]">
                      <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="10 20" className={cn(config.color, "opacity-30")} />
                    </svg>
                  </div>
                )}
                
                <div className={cn("relative z-20 flex flex-col items-center gap-2", config.color)}>
                   {state === 'SUCCESS' ? (
                     <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                       <CheckCircle2 size={52} strokeWidth={2.5} />
                     </motion.div>
                   ) : state === 'FAILED' ? (
                     <motion.div animate={{ x: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.1 }}>
                       <AlertCircle size={52} strokeWidth={2.5} />
                     </motion.div>
                   ) : (
                     <Icon size={40} strokeWidth={2} className="animate-pulse" />
                   )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CONTENT: REFINED TYPOGRAPHY */}
        <div className="space-y-6">
          <div className="space-y-2">
            <motion.h2 
              key={`title-${state}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "text-[32px] md:text-[40px] font-black uppercase tracking-tighter leading-none italic",
                config.color
              )}
            >
              {config.label}
            </motion.h2>
            <div className="h-1 w-12 bg-black/5 mx-auto rounded-full" />
          </div>

          <motion.div 
            key={`desc-${state}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <p className="text-[10px] md:text-[11px] font-black text-black/20 uppercase tracking-[0.3em] leading-relaxed max-w-[240px] mx-auto">
              {config.description}
            </p>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 text-[#E53935] px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider inline-block border border-red-100 shadow-sm"
              >
                {error}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* FOOTER ACTION */}
        <div className="w-full max-w-[240px]">
          <AnimatePresence>
            {state === 'FAILED' && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                whileHover={{ scale: 1.02, backgroundColor: '#000' }}
                whileTap={{ scale: 0.98 }}
                onClick={onRetry}
                className="h-14 w-full bg-[#1A1A1A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all group"
              >
                <span>Retry Connection</span>
                <Zap size={14} className="text-amber-400 group-hover:animate-bounce" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}
