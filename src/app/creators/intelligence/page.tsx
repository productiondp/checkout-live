"use client";

import React, { useState } from "react";
import { Sparkles, TrendingUp, MapPin, Zap, BrainCircuit, Activity, Users } from "lucide-react";
import Button from "@/components/ui/Button";

export default function MarketIntelligenceDashboard() {
  const [location, setLocation] = useState("Trivandrum");

  return (
    <div className="bg-[#FBFBFD] min-h-screen pb-32">
      
      {/* Hero */}
      <div className="bg-black text-white p-6 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070')] bg-cover bg-center opacity-10" />
        <div className="max-w-7xl mx-auto relative z-10 space-y-6 pt-10 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-black uppercase tracking-[0.2em]">
            <BrainCircuit size={14} /> AI Market Intelligence
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                Hyperlocal Demand.
              </h1>
              <p className="text-white/60 font-medium mt-2 max-w-xl">
                Real-time AI analysis of the creator economy in your specific region.
              </p>
            </div>
            
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <select className="h-14 pl-12 pr-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold uppercase tracking-widest text-xs focus:outline-none appearance-none">
                <option value="Trivandrum" className="text-black">Trivandrum, India</option>
                <option value="Kochi" className="text-black">Kochi, India</option>
                <option value="Bangalore" className="text-black">Bangalore, India</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        
        {/* Macro Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black/40">Market Heat Index</h3>
            <div className="flex justify-between items-end">
              <span className="text-5xl font-black text-[#E53935]">84/100</span>
              <span className="text-xs font-bold uppercase text-[#E53935] flex items-center gap-1"><TrendingUp size={14}/> Very High</span>
            </div>
            <p className="text-sm font-medium text-black/60 pt-2 border-t border-black/5">
              Business demand is currently outpacing creator supply by 15%.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black/40">Average Project Value</h3>
            <div className="flex justify-between items-end">
              <span className="text-5xl font-black">$1.2k</span>
              <span className="text-xs font-bold uppercase text-green-500 flex items-center gap-1"><TrendingUp size={14}/> +8%</span>
            </div>
            <p className="text-sm font-medium text-black/60 pt-2 border-t border-black/5">
              Budgets for UGC and Video Production are driving the average up.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black/40">Fastest Growing Category</h3>
            <div className="flex justify-between items-end">
              <span className="text-4xl font-black tracking-tight">UGC Creators</span>
              <span className="text-xs font-bold uppercase text-blue-500 flex items-center gap-1"><Zap size={14}/> +45%</span>
            </div>
            <p className="text-sm font-medium text-black/60 pt-2 border-t border-black/5">
              Local restaurants and FMCG brands are shifting spend from Influencers to UGC.
            </p>
          </div>
        </div>

        {/* Trending Skills & AI Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tight text-xl">Trending Skills</h3>
              <Activity size={20} className="text-black/40" />
            </div>
            <div className="space-y-6">
              {[
                { name: "Short-form Video Editing", demand: 98, trend: "up" },
                { name: "Food Styling", demand: 85, trend: "up" },
                { name: "Brand Ambassadorship", demand: 72, trend: "down" },
                { name: "Drone Videography", demand: 68, trend: "up" }
              ].map((skill, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span>{skill.name}</span>
                    <span className={skill.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                      {skill.demand}% Demand Match
                    </span>
                  </div>
                  <div className="w-full bg-black/5 rounded-full h-2">
                    <div className={`${skill.trend === 'up' ? 'bg-black' : 'bg-black/20'} h-2 rounded-full`} style={{ width: `${skill.demand}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                <Sparkles size={18} />
              </div>
              <h3 className="font-black uppercase tracking-tight text-xl text-blue-900">AI Growth Suggestions</h3>
            </div>
            <p className="text-blue-800/70 font-medium">
              Based on the market data in {location}, our AI has generated these actionable insights for your profile:
            </p>
            
            <div className="space-y-4 pt-4">
              <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
                <h4 className="font-bold text-sm text-black">Update your pricing</h4>
                <p className="text-xs text-black/60 font-medium">Your current day rate is $400. The market average for Elite Photographers in Trivandrum has risen to $650. Consider raising your rates.</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
                <h4 className="font-bold text-sm text-black">Add "CapCut" to skills</h4>
                <p className="text-xs text-black/60 font-medium">24% of new local opportunities in your category are explicitly asking for CapCut experience. Adding this will increase your match rate.</p>
              </div>
            </div>
            
            <Button className="w-full h-12 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-[0.1em] hover:bg-blue-700 transition-colors">
              Apply AI Suggestions
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}
