"use client";

import React, { useState } from "react";
import { TrendingUp, Users, CheckCircle, Clock, Search, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function CreatorAnalyticsDashboard() {
  const [view, setView] = useState<"OVERVIEW" | "GROWTH" | "LIQUIDITY">("OVERVIEW");

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            <Shield size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Elite Creator Status</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
            Analytics.
          </h1>
          <p className="text-black/40 font-medium text-lg max-w-xl">
            Track your profile visibility, hire rates, and trust score growth.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { title: "Profile Views", val: "1,245", trend: "+12%", color: "text-blue-500" },
           { title: "Search Appearances", val: "8,302", trend: "+45%", color: "text-purple-500" },
           { title: "Invite Rate", val: "22%", trend: "+5%", color: "text-green-500" },
           { title: "Repeat Clients", val: "85%", trend: "+2%", color: "text-orange-500" }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-black/40">{stat.title}</h3>
             <div className="flex justify-between items-end">
               <span className="text-3xl font-black">{stat.val}</span>
               <span className={`text-xs font-bold uppercase ${stat.color}`}>{stat.trend}</span>
             </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Liquidity / Hire Pipeline */}
        <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-black uppercase tracking-tight">Hire Pipeline</h3>
             <TrendingUp size={20} className="text-black/40" />
           </div>
           
           <div className="space-y-6">
             <div className="space-y-2">
               <div className="flex justify-between text-sm font-bold">
                 <span>Shortlists</span>
                 <span>142</span>
               </div>
               <div className="w-full bg-black/5 rounded-full h-3">
                 <div className="bg-black h-3 rounded-full" style={{ width: '100%' }}></div>
               </div>
             </div>
             
             <div className="space-y-2">
               <div className="flex justify-between text-sm font-bold">
                 <span>Interviews/Chats</span>
                 <span>48</span>
               </div>
               <div className="w-full bg-black/5 rounded-full h-3">
                 <div className="bg-blue-500 h-3 rounded-full" style={{ width: '33%' }}></div>
               </div>
             </div>

             <div className="space-y-2">
               <div className="flex justify-between text-sm font-bold">
                 <span>Hires (Contracts Signed)</span>
                 <span>12</span>
               </div>
               <div className="w-full bg-black/5 rounded-full h-3">
                 <div className="bg-green-500 h-3 rounded-full" style={{ width: '8%' }}></div>
               </div>
             </div>
           </div>
        </div>

        {/* Growth Engine Recommendations */}
        <div className="bg-black text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
           <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
           <h3 className="text-xl font-black uppercase tracking-tight mb-2 relative z-10">Growth Engine</h3>
           <p className="text-white/60 font-medium text-sm mb-8 relative z-10">AI-driven recommendations to reach the next tier.</p>
           
           <div className="space-y-4 relative z-10">
             <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-start gap-4">
               <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                 <CheckCircle size={18} />
               </div>
               <div>
                 <p className="font-bold text-sm">Add 2 more Case Studies</p>
                 <p className="text-xs text-white/60 mt-1">Profiles with case studies have a 40% higher conversion rate.</p>
               </div>
             </div>
             
             <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-start gap-4">
               <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                 <Clock size={18} />
               </div>
               <div>
                 <p className="font-bold text-sm">Update your Availability</p>
                 <p className="text-xs text-white/60 mt-1">Setting your status to 'Available Now' pushes you to the top of Local Discovery.</p>
               </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
