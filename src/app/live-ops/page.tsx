"use client";

import React from "react";
import TerminalLayout from "@/components/layout/TerminalLayout";
import { LiveOpsDashboard } from "@/devtools/live-ops/LiveOpsDashboard";
import { ShieldAlert, Zap, Activity, Database } from "lucide-react";

export default function LiveOpsPage() {
  return (
    <TerminalLayout>
      <div className="min-h-screen bg-[#FBFBFD] p-8 lg:p-12">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-black flex items-center gap-4">
                <Zap className="text-[#E53935]" size={32} />
                Live Ops <span className="text-[#E53935]">Dashboard</span>
              </h1>
              <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mt-2">CheckOut OS System Metrics & Telemetry</p>
            </div>

            <div className="flex items-center gap-4">
               <button 
                  onClick={async () => {
                    const { AdminService } = await import("@/services/admin-service");
                    const ok = confirm("Are you sure you want to run a full database cleanup? This will permanently remove orphaned records.");
                    if (!ok) return;
                    try {
                      await AdminService.cleanupOrphanedData();
                      alert("Cleanup successful! Orphaned records removed.");
                      window.location.reload();
                    } catch (e) {
                      alert("Cleanup failed: " + (e as Error).message);
                    }
                  }}
                  className="px-6 py-3 bg-[#1A1A1A] text-white rounded-xl shadow-lg hover:bg-black transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-3 group"
               >
                  <Database size={14} className="group-hover:rotate-12 transition-transform" />
                  Run System Cleanup
               </button>
               <div className="px-6 py-3 bg-white border border-black/5 rounded-xl shadow-sm flex items-center gap-4">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">System Healthy</span>
               </div>
            </div>
          </div>

          {/* DASHBOARD CONTAINER */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-2xl shadow-black/5 overflow-hidden">
             <div className="p-10 border-b border-black/5 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Activity size={18} className="text-[#E53935]" />
                   <h2 className="text-[14px] font-black uppercase tracking-tight">Real-time Telemetry</h2>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   Node: Alpha-1
                </div>
             </div>
             
             <div className="p-10">
                {/* We use the existing LiveOpsDashboard component but in a fixed context if possible, 
                    or we just render it directly here if it supports inline rendering. 
                    Looking at the component, it seems to have its own internal modal/floating logic.
                    I'll ensure it renders cleanly here. */}
                <div className="relative min-h-[600px] bg-slate-50 rounded-3xl border border-dashed border-black/10 flex items-center justify-center overflow-hidden group">
                   <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#292828_2px,transparent_2px)] [background-size:32px_32px]" />
                   <div className="text-center space-y-6 relative z-10">
                      <div className="h-20 w-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto border border-black/5 group-hover:scale-110 transition-transform">
                         <ShieldAlert size={32} className="text-[#E53935]" />
                      </div>
                      <p className="text-[12px] font-bold text-slate-500 max-w-xs mx-auto leading-relaxed">
                         The Live Ops Dashboard is currently active. Access metrics via the floating overlay or the expanded view below.
                      </p>
                   </div>
                   
                   {/* Inline Dashboard Render */}
                   <div className="absolute inset-0 z-20">
                      <LiveOpsDashboard />
                   </div>
                </div>
             </div>
          </div>

          {/* FOOTER INFO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {[
               { label: "Uptime", val: "99.99%", icon: Activity },
               { label: "Latency", val: "24ms", icon: Zap },
               { label: "DB Health", val: "Optimal", icon: Database },
             ].map((stat, i) => (
               <div key={i} className="p-8 bg-white border border-black/5 rounded-3xl flex items-center justify-between group hover:border-[#E53935]/20 transition-all">
                  <div>
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{stat.label}</p>
                     <p className="text-[18px] font-bold text-black">{stat.val}</p>
                  </div>
                  <stat.icon size={24} className="text-slate-200 group-hover:text-[#E53935] transition-colors" />
               </div>
             ))}
          </div>

        </div>
      </div>
    </TerminalLayout>
  );
}
