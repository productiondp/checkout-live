"use client";

import React, { useState } from "react";
import { Check, Star, Zap, Crown, TrendingUp, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CreatorProUpgradePage() {
  const [cycle, setCycle] = useState<"MONTHLY" | "ANNUALLY">("ANNUALLY");

  return (
    <div className="bg-[#FBFBFD] min-h-screen pb-32">
      
      {/* Hero */}
      <div className="bg-black text-white px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10px] font-black uppercase tracking-[0.2em]">
            <Crown size={14} /> Checkout Pro
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
            Unlock Your Growth Engine.
          </h1>
          <p className="text-lg text-white/60 font-medium max-w-2xl mx-auto">
            Upgrade to Pro to boost your visibility, access AI-driven portfolio insights, and win higher-paying opportunities.
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-8 bg-white/5 w-fit mx-auto p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setCycle("MONTHLY")}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all ${cycle === "MONTHLY" ? "bg-white text-black" : "text-white/40 hover:text-white"}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setCycle("ANNUALLY")}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${cycle === "ANNUALLY" ? "bg-white text-black" : "text-white/40 hover:text-white"}`}
            >
              Annually <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-[9px]">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Creator Pro */}
          <div className="bg-white rounded-[2rem] p-8 border border-amber-500 shadow-2xl shadow-amber-500/10 relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Most Popular
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Creator Pro</h3>
            <p className="text-black/40 font-medium text-sm mt-2">Everything you need to dominate the local marketplace.</p>
            <div className="my-6">
              <span className="text-5xl font-black">${cycle === "ANNUALLY" ? "19" : "24"}</span>
              <span className="text-black/40 font-bold uppercase tracking-widest text-xs">/mo</span>
            </div>
            <Button className="w-full h-14 rounded-2xl bg-black text-white text-xs font-black uppercase tracking-[0.1em] hover:bg-amber-500 transition-colors">
              Start 14-Day Free Trial
            </Button>
            <div className="mt-8 space-y-4">
              {[
                "Priority Ranking in Discovery Feed",
                "Unlimited Portfolio Uploads",
                "Advanced AI Growth Analytics",
                "Verified Pro Badge",
                "1 Free Profile Boost per month"
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check size={18} className="text-amber-500 shrink-0" />
                  <span className="font-bold text-sm text-black/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Business Pro */}
          <div className="bg-white rounded-[2rem] p-8 border border-black/5 shadow-xl">
            <h3 className="text-2xl font-black uppercase tracking-tight">Business Pro</h3>
            <p className="text-black/40 font-medium text-sm mt-2">Scale your content operations and hire without limits.</p>
            <div className="my-6">
              <span className="text-5xl font-black">${cycle === "ANNUALLY" ? "49" : "59"}</span>
              <span className="text-black/40 font-bold uppercase tracking-widest text-xs">/mo</span>
            </div>
            <Button className="w-full h-14 rounded-2xl bg-black/5 text-black text-xs font-black uppercase tracking-[0.1em] hover:bg-black hover:text-white transition-colors">
              Upgrade to Business
            </Button>
            <div className="mt-8 space-y-4">
              {[
                "Unlimited Opportunities",
                "Unlimited Shortlists",
                "Advanced Creator Filtering",
                "Premium Verification Status",
                "Priority AI Matching"
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check size={18} className="text-black/40 shrink-0" />
                  <span className="font-bold text-sm text-black/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agency / Enterprise */}
          <div className="bg-white rounded-[2rem] p-8 border border-black/5 shadow-xl">
            <h3 className="text-2xl font-black uppercase tracking-tight">Agency</h3>
            <p className="text-black/40 font-medium text-sm mt-2">Built for teams managing multiple brand portfolios.</p>
            <div className="my-6">
              <span className="text-5xl font-black">${cycle === "ANNUALLY" ? "199" : "249"}</span>
              <span className="text-black/40 font-bold uppercase tracking-widest text-xs">/mo</span>
            </div>
            <Button className="w-full h-14 rounded-2xl bg-black/5 text-black text-xs font-black uppercase tracking-[0.1em] hover:bg-black hover:text-white transition-colors">
              Contact Sales
            </Button>
            <div className="mt-8 space-y-4">
              {[
                "Shared Creator Pools",
                "Multiple Team Members",
                "Role-Based Access Control",
                "Agency Branding",
                "Dedicated Account Manager"
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check size={18} className="text-black/40 shrink-0" />
                  <span className="font-bold text-sm text-black/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
