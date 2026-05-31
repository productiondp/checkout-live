"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  Target, 
  Users, 
  X,
  Plus,
  Zap,
  Globe,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StartHereCardProps {
  onAction: () => void;
  onExplore: () => void;
}

export default function StartHereCard({ onAction, onExplore }: StartHereCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show only if not dismissed
    const dismissed = localStorage.getItem("dismissed_start_here");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("dismissed_start_here", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-10"
    >
      <div className="bg-[#0A0A0A] rounded-2xl p-8 lg:p-12 shadow-2xl relative overflow-hidden group border border-white/5">
        
        {/* Dynamic Background Accents */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-50">
           <div className="absolute top-[-40%] right-[-10%] w-[500px] h-[500px] bg-[#E53935]/10 blur-[100px] rounded-full" />
           <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-indigo-500/5 blur-[80px] rounded-full" />
        </div>
        
        <button 
          onClick={dismiss}
          className="absolute top-6 right-6 h-8 w-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all group z-20"
        >
          <X size={14} className="text-white/40 group-hover:text-white" />
        </button>

        <div className="relative z-10">
           <div className="flex flex-col gap-8">
              <div className="space-y-4">
                 {/* STATUS BADGE */}
                 <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#E53935]/10 border border-[#E53935]/20 rounded-lg">
                    <div className="h-1 w-1 bg-[#E53935] rounded-full animate-pulse" />
                     <span className="text-[9px] font-black tracking-widest text-[#E53935]">Account Ready</span>
                 </div>
                 
                 <div className="space-y-3">
                     <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white">
                        Build with the right partners.
                     </h2>
                    <p className="text-[15px] font-bold text-white/40 leading-relaxed max-w-2xl">
                       Your profile is verified. Post what you are looking for or find people to grow your business faster.
                    </p>
                 </div>
              </div>

              {/* ENHANCED ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAction}
                    className="h-14 px-8 bg-gradient-to-br from-[#E53935] to-[#D32F2F] text-white rounded-xl text-[12px] font-black tracking-widest shadow-[0_10px_30px_rgba(229,57,51,0.3)] hover:shadow-[0_20px_40px_rgba(229,57,51,0.4)] transition-all flex items-center justify-center gap-3 w-full sm:w-auto"
                  >
                     <Plus size={18} strokeWidth={3} />
                     <span>Post Now</span>
                  </motion.button>
                 
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onExplore}
                    className="h-14 px-8 bg-white/5 border border-white/10 text-white rounded-xl text-[12px] font-black tracking-widest backdrop-blur-md hover:bg-white/10 transition-all flex items-center justify-center gap-3 w-full sm:w-auto"
                  >
                     <span>Find Partners</span>
                     <ArrowRight size={18} strokeWidth={3} />
                  </motion.button>
              </div>
           </div>

           {/* CONDENSED FOOTER */}
           <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-x-12 gap-y-6">
              {[
                 { icon: Globe, label: "Network", val: "8,400+ People", color: "text-[#E53935]" },
                 { icon: Zap, label: "Success", val: "98% Match", color: "text-amber-400" },
                 { icon: Rocket, label: "Speed", val: "2x Faster", color: "text-emerald-400" }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <item.icon size={18} className={item.color} />
                   </div>
                    <div>
                       <p className="text-[12px] font-black text-white leading-none mb-1">{item.val}</p>
                       <p className="text-[8px] font-bold text-white/40 tracking-widest">{item.label}</p>
                    </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
